<?php

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

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
    check(app(IntegrityPreflight::class)->inspect(0)['checks']['invalid_message_targets']['count'] === 1, 'deletion orphan blocks constraint readiness');
} finally {
    DB::rollBack();
}
echo $passed." MySQL invariant checks passed; synthetic transaction rolled back.\n";
