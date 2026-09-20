<?php

// Deterministic two-process races against the real application and InnoDB.
// Run only through the disposable Compose stack; never PHPUnit/production.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
set_exception_handler(function (Throwable $error): never {
    fwrite(STDERR, 'Concurrency check failed: '.$error::class.' at '.basename($error->getFile()).':'.$error->getLine()."\n");
    exit(1);
});

use App\Events\MessageSent;
use App\Http\Controllers\MessageController;
use App\Models\Conversation;
use App\Models\Group;
use App\Models\GroupUser;
use App\Models\Message;
use App\Models\Profile;
use App\Models\User;
use App\Repositories\ProfileRepository;
use App\Services\GroupService;
use App\Services\MessageService;
use Illuminate\Http\Request;
use Illuminate\Notifications\Events\BroadcastNotificationCreated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;

if (! app()->environment('testing') || DB::getDriverName() !== 'mysql'
    || DB::connection()->getDatabaseName() !== 'elevateu_audit'
    || config('database.connections.mysql.host') !== 'mysql'
    || config('database.connections.mysql.url')) {
    throw new RuntimeException('Concurrency tests require the isolated MySQL audit stack.');
}
if (! function_exists('pcntl_fork')) {
    throw new RuntimeException('The test runtime requires pcntl.');
}

/** Pause both real repository reads after SELECT but before either INSERT. */
function concurrently(string $table, callable $operation): array
{
    $directory = storage_path('framework/testing/race-'.bin2hex(random_bytes(8)));
    if (! mkdir($directory, 0700, true)) {
        throw new RuntimeException('Cannot create barrier directory.');
    }
    // Do not share an open PDO socket across forked processes.
    DB::disconnect();
    $children = [];
    try {
        for ($worker = 0; $worker < 2; $worker++) {
            $pid = pcntl_fork();
            if ($pid === -1) {
                throw new RuntimeException('Could not start race worker.');
            }
            if ($pid === 0) {
                try {
                    DB::purge();
                    $waited = false;
                    $currentReads = 0;
                    DB::listen(function ($query) use ($table, $directory, $worker, &$waited, &$currentReads): void {
                        if (str_starts_with($query->sql, 'select * from `'.$table.'`') && str_ends_with($query->sql, 'for update')) {
                            $currentReads++;
                        }
                        if ($waited || ! str_starts_with($query->sql, 'select * from `'.$table.'`')) {
                            return;
                        }
                        $waited = true;
                        if (file_put_contents($directory.'/'.$worker.'.ready', 'ready') === false) {
                            throw new RuntimeException('Cannot signal race barrier.');
                        }
                        $deadline = microtime(true) + 20;
                        while (count(glob($directory.'/*.ready')) !== 2) {
                            if (microtime(true) > $deadline) {
                                throw new RuntimeException('Race barrier timed out.');
                            }
                            usleep(10000);
                        }
                    });
                    $result = $operation($worker);
                    if (! $waited) {
                        throw new RuntimeException('Repository SELECT did not reach the barrier.');
                    }
                    file_put_contents($directory.'/'.$worker.'.result', json_encode(['result' => $result, 'current_reads' => $currentReads], JSON_THROW_ON_ERROR));
                    exit(0);
                } catch (Throwable $exception) {
                    fwrite(STDERR, 'Race worker failed: '.$exception::class.' at '.basename($exception->getFile()).':'.$exception->getLine()."\n");
                    exit(1);
                }
            }
            $children[] = $pid;
        }
        $failed = false;
        foreach ($children as $pid) {
            pcntl_waitpid($pid, $status);
            $failed = $failed || ! pcntl_wifexited($status) || pcntl_wexitstatus($status) !== 0;
        }
        if ($failed) {
            throw new RuntimeException('At least one MySQL race worker failed.');
        }
        $results = array_map(fn ($worker) => json_decode(file_get_contents($directory.'/'.$worker.'.result'), true, flags: JSON_THROW_ON_ERROR), [0, 1]);
        if (array_sum(array_column($results, 'current_reads')) !== 1) {
            throw new RuntimeException('Expected exactly one losing insert to recover with a current read.');
        }

        return array_column($results, 'result');
    } finally {
        foreach (glob($directory.'/*') as $marker) {
            unlink($marker);
        }
        rmdir($directory);
        DB::purge();
    }
}

function verify(bool $condition, string $name): void
{
    if (! $condition) {
        throw new RuntimeException('FAIL: '.$name);
    }
    echo 'PASS: '.$name."\n";
}

for ($round = 1; $round <= 3; $round++) {
    $users = User::factory()->withProfile()->count(3)->create();
    [$a, $b, $owner] = $users->all();
    $profileUser = User::factory()->create();
    $group = Group::factory()->create(['owner_id' => $owner->id]);
    try {
        $results = concurrently('conversations', function (int $worker) use ($a, $b): string {
            return app(MessageService::class)->createMessage($worker === 0 ? $a->id : $b->id, [
                'receiver_id' => $worker === 0 ? $b->id : $a->id, 'message' => 'Synthetic race fixture',
            ])['message']->conversation_id;
        });
        verify($results[0] === $results[1] && Conversation::whereIn('user_id1', [$a->id, $b->id])->count() === 1
            && Message::where('conversation_id', $results[0])->count() === 2, "round $round: A/B resolve one conversation, two distinct messages, loser recovered");
        $results = concurrently('group_users', fn () => DB::transaction(fn () => app(GroupService::class)->addUserToGroup($group->id, $b->id, $owner->id)->user_id));
        verify($results === [$b->id, $b->id] && GroupUser::where('group_id', $group->id)->where('user_id', $b->id)->count() === 1,
            "round $round: one membership, loser recovered inside repeatable-read transaction");
        $results = concurrently('profiles', fn () => DB::transaction(fn () => app(ProfileRepository::class)->createProfile([
            'user_id' => $profileUser->id, 'first_name' => 'Synthetic', 'last_name' => 'Profile',
        ])->id));
        verify($results[0] === $results[1] && Profile::where('user_id', $profileUser->id)->count() === 1,
            "round $round: one profile, both callers resolve same ID, loser recovered");

        $clientUuid = (string) Str::uuid();
        $results = concurrently('conversations', function () use ($a, $owner, $clientUuid): array {
            // Persist real database notifications; capture broadcast dispatches
            // so worker cleanup cannot leave queued jobs for deleted fixtures.
            Event::fake([MessageSent::class, BroadcastNotificationCreated::class]);
            $request = Request::create('/api/messages', 'POST', [
                'receiver_id' => $owner->id, 'message' => 'Synthetic idempotent race', 'client_uuid' => $clientUuid,
            ]);
            app()->instance('request', $request);
            $request->setUserResolver(fn () => $a);
            $response = app(MessageController::class)->store($request);

            return ['status' => $response->getStatusCode(), 'id' => $response->getData(true)['data']['message']['id'],
                'events' => Event::dispatched(MessageSent::class)->count(),
                'notification_events' => Event::dispatched(BroadcastNotificationCreated::class)->count()];
        });
        $statuses = array_column($results, 'status');
        sort($statuses);
        $message = Message::where('sender_id', $a->id)->where('client_uuid', $clientUuid)->sole();
        verify($statuses === [200, 201] && $results[0]['id'] === $results[1]['id']
            && array_sum(array_column($results, 'events')) === 1
            && array_sum(array_column($results, 'notification_events')) === 1
            && DB::table('notifications')->where('notifiable_id', $owner->id)->count() === 1
            && Conversation::findOrFail($message->conversation_id)->last_message_id === $message->id,
            "round $round: same client UUID yields one message, notification and event; statuses 201/200; last pointer correct");
    } finally {
        DB::table('notifications')->whereIn('notifiable_id', $users->modelKeys())->delete();
        Message::whereIn('sender_id', $users->modelKeys())->delete();
        Conversation::whereIn('user_id1', $users->modelKeys())->orWhereIn('user_id2', $users->modelKeys())->delete();
        $group->delete();
        User::whereIn('id', [...$users->modelKeys(), $profileUser->id])->delete();
    }
}
echo "12 deterministic races passed (24 callers); 12 expected unique-conflict recoveries observed.\n";
