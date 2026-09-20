<?php

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
set_exception_handler(function (Throwable $error): never {
    fwrite(STDERR, 'Invariant check failed: '.$error::class.' at '.basename($error->getFile()).':'.$error->getLine()."\n");
    exit(1);
});

use App\Models\Comment;
use App\Models\Group;
use App\Models\Like;
use App\Models\Message;
use App\Models\User;
use App\Services\Database\IntegrityPreflight;
use App\Services\MessageService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

if (! app()->environment('testing') || DB::getDriverName() !== 'mysql'
    || DB::connection()->getDatabaseName() !== 'elevateu_audit'
    || config('database.connections.mysql.host') !== 'mysql'
    || config('database.connections.mysql.url')) {
    throw new RuntimeException('MySQL invariant checks require the isolated audit stack.');
}
$passed = 0;
function check(bool $condition, string $name): void
{
    global $passed;
    if (! $condition) {
        throw new RuntimeException('FAIL: '.$name);
    }
    $passed++;
    echo 'PASS: '.$name."\n";
}
function rejects(callable $operation, int $mysqlCode, string $name): void
{
    try {
        $operation();
    } catch (QueryException $exception) {
        check((int) $exception->errorInfo[1] === $mysqlCode, $name);

        return;
    }
    throw new RuntimeException('MySQL unexpectedly accepted '.$name);
}
DB::beginTransaction();
try {
    $like = Like::factory()->create();
    rejects(fn () => DB::table('likes')->insert(['id' => (string) Str::uuid(), 'user_id' => $like->user_id, 'post_id' => $like->post_id]), 1062, 'non-null like pair uniqueness');
    $user = User::factory()->withProfile()->create();
    rejects(fn () => \App\Models\Profile::factory()->create(['user_id' => $user->id]), 1062, 'one profile per user');
    $membershipGroup = Group::factory()->create();
    rejects(fn () => DB::table('group_users')->insert(['group_id' => $membershipGroup->id, 'user_id' => $membershipGroup->owner_id]), 1062, 'one membership per pair');
    $conversation = \App\Models\Conversation::factory()->create();
    foreach ([[$conversation->user_id1, $conversation->user_id2], [$conversation->user_id2, $conversation->user_id1], [strtoupper($conversation->user_id1), strtoupper($conversation->user_id2)]] as $order => [$a, $b]) {
        rejects(fn () => \App\Models\Conversation::create(['user_id1' => $a, 'user_id2' => $b]), 1062, 'canonical pair uniqueness order '.$order);
    }
    rejects(fn () => \App\Models\Conversation::create(['user_id1' => $user->id, 'user_id2' => $user->id]), 3819, 'database self-conversation CHECK');
    rejects(fn () => Comment::create(['user_id' => $user->id, 'post_id' => (string) Str::uuid(), 'content' => 'Synthetic fixture']), 1452, 'comment foreign key');
    $message = Message::factory()->create(['client_uuid' => (string) Str::uuid()]);
    $copy = $message->getAttributes();
    $copy['id'] = (string) Str::uuid();
    rejects(fn () => DB::table('messages')->insert($copy), 1062, 'sender/client UUID uniqueness');
    check(app(IntegrityPreflight::class)->inspect(0)['ok'], 'factory graph passes MySQL preflight');
    $group = Group::factory()->create();
    DB::table('messages')->where('id', $message->id)->update(['group_id' => $group->id]);
    check(app(IntegrityPreflight::class)->inspect(0)['checks']['invalid_message_targets']['count'] === 1, 'schema permits conflicting targets and preflight detects them');
    DB::table('messages')->where('id', $message->id)->update(['group_id' => null]);
    $groupMessage = Message::factory()->inGroup($group)->create();
    $sender = $groupMessage->sender_id;
    $group->delete();
    check($groupMessage->fresh()->group_id === null, 'group deletion retains orphan message');
    try {
        app(MessageService::class)->getMessageById($groupMessage->id, $sender);
        throw new RuntimeException('Orphan message unexpectedly accessible.');
    } catch (AuthorizationException) {
        check(true, 'orphan message still fails authorization');
    }
    check(app(IntegrityPreflight::class)->inspect(0)['checks']['invalid_message_targets']['count'] === 1, 'deletion orphan remains a reported integrity issue');
} finally {
    DB::rollBack();
}
echo $passed." MySQL invariant checks passed; synthetic transaction rolled back.\n";
