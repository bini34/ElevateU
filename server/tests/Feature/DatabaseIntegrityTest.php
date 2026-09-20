<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\FileAttachment;
use App\Models\Group;
use App\Models\GroupUser;
use App\Models\Like;
use App\Models\Message;
use App\Models\Post;
use App\Models\Profile;
use App\Models\User;
use App\Services\Database\IntegrityPreflight;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoDataset;
use Database\Seeders\DemoSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class DatabaseIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Storage::fake('message_attachments');
    }

    public function test_empty_schema_and_complete_factory_graph_pass_read_only_checks(): void
    {
        $this->assertTrue($this->report()['ok']);
        Profile::factory()->create();
        Post::factory()->create();
        Comment::factory()->create();
        Like::factory()->create();
        GroupUser::factory()->create();
        $direct = Message::factory()->create();
        Message::factory()->inGroup()->create();
        $public = FileAttachment::factory()->create();
        $private = FileAttachment::factory()->forMessage($direct)->create();
        $queries = [];
        DB::listen(function ($query) use (&$queries) {
            $queries[] = $query->sql;
        });
        $report = $this->report();
        $this->assertTrue($report['ok'], json_encode($report));
        foreach ($queries as $sql) {
            $this->assertStringStartsWith('select', strtolower($sql));
        }
        Storage::disk('public')->assertExists($public->path);
        Storage::disk('message_attachments')->assertExists($private->path);
        Storage::disk('public')->assertMissing($private->path);
        $this->assertSame($private->size, strlen(Storage::disk('message_attachments')->get($private->path)));
        $decoded = imagecreatefromstring(Storage::disk('public')->get($public->path));
        $this->assertNotFalse($decoded, 'Fixture must fully decode, not just have a PNG header.');
        $this->assertSame(1, imagesx($decoded));
        imagedestroy($decoded);
    }

    public function test_duplicate_profiles_memberships_and_both_conversation_orders_are_reported(): void
    {
        // Recreate the historical schema only inside this rollback-isolated SQLite test.
        foreach (array_reverse(glob(database_path('migrations/2026_09_20_*.php'))) as $file) {
            (require $file)->down();
        }
        $a = User::factory()->withProfile()->create();
        $b = User::factory()->withProfile()->create();
        Profile::factory()->create(['user_id' => $a->id]);
        $group = Group::factory()->create(['owner_id' => $a->id]);
        DB::table('group_users')->insert(['group_id' => $group->id, 'user_id' => $a->id]);
        foreach ([[$a->id, $b->id], [$a->id, $b->id], [$b->id, $a->id]] as [$first, $second]) {
            DB::table('conversations')->insert(['id' => (string) Str::uuid(), 'user_id1' => $first, 'user_id2' => $second]);
        }
        $report = $this->report();
        foreach (['duplicate_profiles', 'duplicate_group_users', 'duplicate_conversations', 'duplicate_conversation_pairs', 'reversed_conversation_pairs'] as $key) {
            $this->assertSame(1, $report['checks'][$key]['count'], $key);
        }
        $this->assertFalse($report['ok']);
    }

    public function test_nullable_and_conflicting_targets_and_cross_thread_pointers_are_detected(): void
    {
        $direct = Message::factory()->create();
        $other = Message::factory()->create();
        $group = Group::factory()->create();
        DB::table('messages')->where('id', $direct->id)->update(['group_id' => $group->id, 'receiver_id' => $other->sender_id]);
        DB::table('conversations')->where('id', $direct->conversation_id)->update(['last_message_id' => $other->id]);
        $file = FileAttachment::factory()->create();
        DB::table('file_attachments')->where('id', $file->id)->update(['message_id' => $direct->id, 'size' => -1]);
        $comment = Comment::factory()->create();
        DB::table('comments')->where('id', $comment->id)->update(['post_id' => null]);
        $like = Like::factory()->create();
        DB::table('likes')->where('id', $like->id)->update(['post_id' => null]);
        foreach (['invalid_message_targets', 'direct_message_participants', 'invalid_conversations_last_message', 'invalid_attachment_owner', 'invalid_attachment_metadata', 'comments_without_post', 'likes_without_post'] as $key) {
            $this->assertSame(1, $this->report()['checks'][$key]['count'], $key);
        }
    }

    public function test_deletion_orphans_are_reported_without_treating_removed_senders_as_invalid(): void
    {
        $group = Group::factory()->create();
        $message = Message::factory()->inGroup($group)->create();
        $file = FileAttachment::factory()->forMessage($message)->create();
        GroupUser::where('group_id', $group->id)->delete();
        $this->assertSame(1, $this->report()['checks']['owners_without_membership']['count']);
        $this->assertSame(0, $this->report()['checks']['invalid_message_targets']['count']);
        $group->delete();
        $this->assertNull($message->fresh()->group_id);
        $this->assertSame(1, $this->report()['checks']['invalid_message_targets']['count']);
        $message->delete();
        $this->assertNull($file->fresh()->message_id);
        $this->assertSame(1, $this->report()['checks']['invalid_attachment_owner']['count']);
    }

    public function test_orphans_and_missing_aggregates_are_counted_without_sensitive_output(): void
    {
        User::factory()->create(); // Deliberate missing profile.
        DB::table('notifications')->insert(['id' => (string) Str::uuid(), 'type' => 'private-notification-text', 'notifiable_type' => User::class, 'notifiable_id' => (string) Str::uuid(), 'data' => '{"secret":"NEVER_PRINT_THIS"}']);
        DB::table('oauth_refresh_tokens')->insert(['id' => 'NEVER_PRINT_TOKEN', 'access_token_id' => 'MISSING_SECRET', 'revoked' => false]);
        $before = DB::table('notifications')->get()->toJson();
        $this->assertSame(1, Artisan::call('elevateu:db-preflight', ['--json' => true, '--sample' => 1]));
        $output = Artisan::output();
        $result = json_decode($output, true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame(1, $result['checks']['missing_profiles']['count']);
        $this->assertSame(1, $result['checks']['orphan_notifications']['count']);
        $this->assertSame(1, $result['checks']['orphan_oauth_refresh_tokens_access_token_id']['count']);
        foreach (['NEVER_PRINT', 'MISSING_SECRET', 'private-notification-text'] as $secret) {
            $this->assertStringNotContainsString($secret, $output);
        }
        $this->assertSame($before, DB::table('notifications')->get()->toJson());
        $this->assertSame(2, Artisan::call('elevateu:db-preflight', ['--sample' => 21]));
    }

    public function test_existing_like_unique_constraint_rejects_duplicate_non_null_pair(): void
    {
        $like = Like::factory()->create();
        $this->expectException(QueryException::class);
        DB::table('likes')->insert(['id' => (string) Str::uuid(), 'user_id' => $like->user_id, 'post_id' => $like->post_id]);
    }

    public function test_existing_sender_client_uuid_unique_constraint_rejects_duplicate(): void
    {
        $message = Message::factory()->create(['client_uuid' => (string) Str::uuid()]);
        $copy = $message->getAttributes();
        $copy['id'] = (string) Str::uuid();
        $this->expectException(QueryException::class);
        DB::table('messages')->insert($copy);
    }

    public function test_existing_foreign_key_rejects_missing_post_parent(): void
    {
        $user = User::factory()->withProfile()->create();
        $this->expectException(QueryException::class);
        DB::table('comments')->insert(['id' => (string) Str::uuid(), 'user_id' => $user->id, 'post_id' => (string) Str::uuid(), 'content' => 'Fixture']);
    }

    public function test_demo_is_repeatable_without_resetting_passwords_or_content(): void
    {
        $this->enableDemo();
        $this->seed(DemoSeeder::class);
        $this->assertTrue($this->report()['ok']);
        $this->assertDatabaseCount('users', 6);
        $this->assertDatabaseCount('profiles', 6);
        $this->assertDatabaseCount('messages', 12);
        $this->assertDatabaseCount('file_attachments', 2);
        $password = DB::table('users')->where('id', DemoDataset::id('user', 1))->value('password');
        DB::table('posts')->where('id', DemoDataset::id('post', 1))->update(['content' => 'A local edit to preserve']);
        config(['demo.password' => 'Different-test-only-password']);
        $this->seed(DemoSeeder::class);
        $this->assertDatabaseCount('users', 6);
        $this->assertDatabaseCount('group_users', 6);
        $this->assertSame($password, DB::table('users')->where('id', DemoDataset::id('user', 1))->value('password'));
        $this->assertDatabaseHas('posts', ['id' => DemoDataset::id('post', 1), 'content' => 'A local edit to preserve']);
        $this->assertTrue($this->report()['ok']);
    }

    public function test_demo_refuses_identity_collision_transactionally(): void
    {
        $this->enableDemo();
        $existing = User::factory()->withProfile()->create(['email' => 'mira@elevateu.example']);
        try {
            $this->seed(DemoSeeder::class);
            $this->fail('Expected identity collision refusal.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('collides', $exception->getMessage());
        }
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('posts', 0);
        $this->assertDatabaseHas('users', ['id' => $existing->id]);
    }

    public function test_default_seeder_is_empty_and_demo_requires_enablement(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->assertDatabaseCount('users', 0);
        config(['demo.enabled' => false]);
        $this->expectException(\RuntimeException::class);
        $this->seed(DemoSeeder::class);
    }

    public function test_demo_refuses_production_even_when_explicitly_enabled(): void
    {
        $this->enableDemo();
        $this->app->instance('env', 'production');
        $this->expectException(\RuntimeException::class);
        (new DemoSeeder)->run();
    }

    public function test_demo_refuses_a_non_allowlisted_database_without_writes(): void
    {
        $this->enableDemo();
        $connection = DB::connection();
        $original = $connection->getDatabaseName();
        $connection->setDatabaseName('ElevateU-DB');
        try {
            (new DemoSeeder)->run();
            $this->fail('Expected refusal of the normal development database name.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('isolated', $exception->getMessage());
        } finally {
            $connection->setDatabaseName($original);
        }
        $this->assertDatabaseCount('users', 0);
    }

    public function test_demo_file_conflict_rolls_back_rows_and_only_removes_new_files(): void
    {
        $this->enableDemo();
        $files = DemoDataset::rows('unused-test-hash')['file_attachments'];
        Storage::disk('message_attachments')->put($files[1]['path'], 'Existing file to preserve');
        try {
            (new DemoSeeder)->run();
            $this->fail('Expected refusal to overwrite the existing file.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('refusing to overwrite', $exception->getMessage());
        }
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('file_attachments', 0);
        Storage::disk('public')->assertMissing($files[0]['path']);
        $this->assertSame('Existing file to preserve', Storage::disk('message_attachments')->get($files[1]['path']));
    }

    public function test_demo_rejects_missing_or_unsafe_password_length_before_writes(): void
    {
        $this->enableDemo();
        foreach ([null, '', 'short', str_repeat('x', 73)] as $password) {
            config(['demo.password' => $password]);
            try {
                (new DemoSeeder)->run();
                $this->fail('Expected password configuration refusal.');
            } catch (\RuntimeException $exception) {
                $this->assertStringContainsString('12 through 72 bytes', $exception->getMessage());
            }
        }
        $this->assertDatabaseCount('users', 0);
    }

    private function report(): array
    {
        return app(IntegrityPreflight::class)->inspect();
    }

    private function enableDemo(): void
    {
        config(['demo.enabled' => true, 'demo.password' => 'Fixture-only-password-42']);
    }
}
