<?php

// Characterization test of known races, not a claim that uniqueness is fixed.
// Run only through the disposable Compose stack; never PHPUnit/production.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Conversation;
use App\Models\Group;
use App\Models\GroupUser;
use App\Models\Message;
use App\Models\User;
use App\Services\Database\IntegrityPreflight;
use App\Services\GroupService;
use App\Services\MessageService;
use Illuminate\Support\Facades\DB;

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
function concurrently(string $table, callable $operation): void
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
                    DB::listen(function ($query) use ($table, $directory, $worker, &$waited): void {
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
                    $operation($worker);
                    if (! $waited) {
                        throw new RuntimeException('Repository SELECT did not reach the barrier.');
                    }
                    exit(0);
                } catch (Throwable $exception) {
                    fwrite(STDERR, 'Race worker failed: '.$exception::class."\n");
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
    } finally {
        foreach (glob($directory.'/*.ready') as $marker) {
            unlink($marker);
        }
        rmdir($directory);
        DB::purge();
    }
}

$users = User::factory()->withProfile()->count(3)->create();
[$a, $b, $owner] = $users->all();
$group = Group::factory()->create(['owner_id' => $owner->id]);
try {
    concurrently('conversations', function (int $worker) use ($a, $b): void {
        app(MessageService::class)->createMessage($worker === 0 ? $a->id : $b->id, [
            'receiver_id' => $worker === 0 ? $b->id : $a->id, 'message' => 'Synthetic race fixture',
        ]);
    });
    concurrently('group_users', function () use ($group, $b, $owner): void {
        app(GroupService::class)->addUserToGroup($group->id, $b->id, $owner->id);
    });
    $conversations = Conversation::whereIn('user_id1', [$a->id, $b->id])->whereIn('user_id2', [$a->id, $b->id])->count();
    $memberships = GroupUser::where('group_id', $group->id)->where('user_id', $b->id)->count();
    $preflight = app(IntegrityPreflight::class)->inspect(0);
    echo json_encode([
        'mysql' => DB::selectOne('SELECT VERSION() AS version')->version,
        'concurrent_conversation_rows' => $conversations,
        'concurrent_membership_rows' => $memberships,
        'known_integrity_races_reproduced' => $conversations === 2 && $memberships === 2,
        'preflight_detected_conversation_race' => $preflight['checks']['duplicate_conversation_pairs']['count'] > 0,
        'preflight_detected_membership_race' => $preflight['checks']['duplicate_group_users']['count'] > 0,
        'disposition' => 'UNRESOLVED: canonical-pair and membership constraints plus application conflict handling required',
    ], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR)."\n";
    if ($conversations !== 2 || $memberships !== 2 || $preflight['ok']) {
        throw new RuntimeException('Race characterization changed; investigate rather than suppress this result.');
    }
} finally {
    // Only IDs created by this test, after the fail-closed stack guard.
    Message::whereIn('sender_id', $users->modelKeys())->delete();
    Conversation::whereIn('user_id1', $users->modelKeys())->delete();
    $group->delete();
    User::whereIn('id', $users->modelKeys())->delete();
}
