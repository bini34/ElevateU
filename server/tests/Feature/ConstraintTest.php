<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Group;
use App\Models\Profile;
use App\Models\User;
use App\Repositories\ConversationRepository;
use App\Repositories\ProfileRepository;
use App\Services\Database\ConstraintReadiness;
use App\Services\Database\IntegrityPreflight;
use App\Services\GroupService;
use App\Support\ConversationParticipants;
use App\Support\UniqueConflict;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Laravel\Passport\Passport;
use Tests\Concerns\UsesPassportKeys;
use Tests\TestCase;

class ConstraintTest extends TestCase
{
    use RefreshDatabase;
    use UsesPassportKeys;

    protected function setUp(): void
    {
        parent::setUp();
        $this->initializePassportKeys();
    }

    public function test_profile_creation_is_idempotent_and_update_remains_explicit(): void
    {
        $user = User::factory()->create();
        $repository = app(ProfileRepository::class);
        $profile = $repository->createProfile(['user_id' => $user->id, 'first_name' => 'First', 'last_name' => 'Person']);
        $retry = $repository->createProfile(['user_id' => $user->id, 'first_name' => 'Ignored', 'last_name' => 'Retry']);
        $this->assertSame($profile->id, $retry->id);
        $this->assertSame('First', $retry->first_name);
        $this->assertSame('Updated', $repository->updateProfile($user->id, ['first_name' => 'Updated'])->first_name);
        $this->assertDatabaseCount('profiles', 1);
    }

    public function test_database_rejects_duplicate_profile(): void
    {
        $profile = Profile::factory()->create();
        $this->expectException(UniqueConstraintViolationException::class);
        Profile::factory()->create(['user_id' => $profile->user_id]);
    }

    public function test_membership_add_remove_and_rejoin_are_idempotent(): void
    {
        $group = Group::factory()->create();
        $user = User::factory()->withProfile()->create();
        $service = app(GroupService::class);
        $service->addUserToGroup($group->id, $user->id, $group->owner_id);
        $service->addUserToGroup($group->id, $user->id, $group->owner_id);
        $this->assertDatabaseCount('group_users', 2);
        $this->assertSame(1, $service->removeUserFromGroup($group->id, $user->id, $group->owner_id));
        $this->assertSame(0, $service->removeUserFromGroup($group->id, $user->id, $group->owner_id));
        $service->addUserToGroup($group->id, $user->id, $group->owner_id);
        $this->assertDatabaseCount('group_users', 2);
    }

    public function test_database_rejects_duplicate_membership(): void
    {
        $group = Group::factory()->create();
        $this->expectException(UniqueConstraintViolationException::class);
        DB::table('group_users')->insert(['group_id' => $group->id, 'user_id' => $group->owner_id]);
    }

    public function test_reversed_existing_conversation_keeps_its_id_and_original_order(): void
    {
        $users = User::factory()->withProfile()->count(2)->create();
        [$low, $high] = ConversationParticipants::ordered(...$users->modelKeys());
        $legacy = Conversation::create(['user_id1' => $high, 'user_id2' => $low]);
        $repository = app(ConversationRepository::class);
        $this->assertSame($legacy->id, $repository->createConversation($low, $high)->id);
        $this->assertSame($legacy->id, $repository->createConversation(strtoupper($high), strtoupper($low))->id);
        $this->assertSame($high, $legacy->fresh()->user_id1);
        $this->assertSame($low, $legacy->fresh()->participant_low);
        $this->assertArrayNotHasKey('participant_low', $legacy->fresh()->toArray());
        $this->assertDatabaseCount('conversations', 1);
    }

    public function test_database_rejects_reversed_conversation_duplicate(): void
    {
        $conversation = Conversation::factory()->create();
        $this->expectException(UniqueConstraintViolationException::class);
        Conversation::create(['user_id1' => $conversation->user_id2, 'user_id2' => $conversation->user_id1]);
    }

    public function test_database_rejects_exact_conversation_duplicate(): void
    {
        $conversation = Conversation::factory()->create();
        $this->expectException(UniqueConstraintViolationException::class);
        Conversation::create(['user_id1' => $conversation->user_id1, 'user_id2' => $conversation->user_id2]);
    }

    public function test_self_conversation_is_rejected_by_database(): void
    {
        $user = User::factory()->withProfile()->create();
        $this->expectException(QueryException::class);
        Conversation::create(['user_id1' => $user->id, 'user_id2' => $user->id]);
    }

    public function test_self_conversation_returns_validation_errors_without_sql_details(): void
    {
        $user = User::factory()->withProfile()->create();
        Passport::actingAs($user);
        $this->postJson('/api/messages', ['receiver_id' => $user->id, 'message' => 'Self'])->assertStatus(422);
        $this->getJson('/api/conversations/with/'.$user->id)->assertStatus(422)->assertJsonValidationErrors('receiver_id');
        $this->assertDatabaseCount('conversations', 0);
    }

    public function test_first_message_retry_returns_same_resource_and_one_notification_and_event(): void
    {
        Event::fake([MessageSent::class]);
        [$sender, $receiver] = User::factory()->withProfile()->count(2)->create()->all();
        Passport::actingAs($sender);
        $this->getJson('/api/conversations/with/'.$receiver->id)->assertOk()->assertJsonPath('data.conversation_id', null);
        $this->assertDatabaseCount('conversations', 0);
        $payload = ['receiver_id' => $receiver->id, 'message' => 'First message', 'client_uuid' => (string) Str::uuid()];
        $first = $this->postJson('/api/messages', $payload)->assertCreated();
        $this->postJson('/api/messages', $payload)->assertOk()->assertJsonPath('data.message.id', $first->json('data.message.id'));
        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('messages', 1);
        $this->assertDatabaseCount('notifications', 1);
        $this->assertSame($first->json('data.message.id'), Conversation::first()->last_message_id);
        Event::assertDispatchedTimes(MessageSent::class, 1);
    }

    public function test_schema_guarantees_are_reported_without_removing_data_checks(): void
    {
        $report = app(IntegrityPreflight::class)->inspect(0);
        $this->assertTrue($report['constraint_migration_safe']);
        foreach (['duplicate_profiles', 'duplicate_group_users', 'duplicate_conversation_pairs', 'self_conversations'] as $name) {
            $this->assertTrue($report['schema_guarantees'][$name]);
            $this->assertSame('schema_enforced', $report['checks'][$name]['state']);
            $this->assertSame(0, $report['checks'][$name]['count']);
        }
    }

    public function test_dirty_legacy_data_blocks_all_three_migrations_before_schema_changes(): void
    {
        $files = glob(database_path('migrations/2026_09_20_*.php'));
        foreach (array_reverse($files) as $file) {
            (require $file)->down();
        }
        $user = User::factory()->withProfile()->create();
        Profile::factory()->create(['user_id' => $user->id]);
        foreach ($files as $file) {
            try {
                (require $file)->up();
                $this->fail('Dirty data must block migration.');
            } catch (\RuntimeException $error) {
                $this->assertStringContainsString('duplicate_profiles', $error->getMessage());
            }
        }
        $report = app(IntegrityPreflight::class)->inspect(0);
        $this->assertSame('migration_blocking', $report['checks']['duplicate_profiles']['state']);
        $this->assertNotContains(true, $report['schema_guarantees']);
        $this->assertDatabaseCount('profiles', 2);
    }

    public function test_malformed_legacy_participants_block_constraints(): void
    {
        foreach (array_reverse(glob(database_path('migrations/2026_09_20_*.php'))) as $file) {
            (require $file)->down();
        }
        $bad = User::factory()->withProfile()->create(['id' => 'not-a-uuid']);
        $other = User::factory()->withProfile()->create();
        Conversation::create(['user_id1' => $bad->id, 'user_id2' => $other->id]);
        $this->assertSame(1, app(IntegrityPreflight::class)->inspect(0)['checks']['malformed_conversation_participants']['count']);
        $this->expectException(\RuntimeException::class);
        ConstraintReadiness::assertClean();
    }

    public function test_unique_conflict_detection_requires_the_expected_key(): void
    {
        $pdo = new \PDOException('Do not log query contents');
        $pdo->errorInfo = ['23000', 1062, "Duplicate entry 'sensitive' for key 'profiles.profiles_user_id_unique'"];
        $expected = new UniqueConstraintViolationException('mysql', 'insert ...', [], $pdo);
        $this->assertTrue(UniqueConflict::matches($expected, 'profiles_user_id_unique', ['profiles.user_id']));
        $this->assertFalse(UniqueConflict::matches($expected, 'other_key', ['profiles.user_id']));
        $this->assertFalse(UniqueConflict::matches(new QueryException('mysql', 'insert ...', [], $pdo), 'profiles_user_id_unique', ['profiles.user_id']));
        $this->assertFalse(UniqueConflict::matches(new \RuntimeException, 'profiles_user_id_unique', ['profiles.user_id']));
    }

    public function test_unexpected_database_errors_still_fail_with_safe_response_and_log(): void
    {
        config(['app.debug' => true]);
        Log::shouldReceive('error')->once()->with('Database operation failed.', \Mockery::on(fn ($context) => $context === ['exception_class' => QueryException::class, 'sqlstate' => 'HY000', 'driver_code' => 999]));
        Route::get('/api/testing-database-failure', function () {
            $pdo = new \PDOException('Sensitive SQL details');
            $pdo->errorInfo = ['HY000', 999, 'private diagnostic'];
            throw new QueryException('sqlite', 'SELECT PRIVATE_CONTENT', ['SECRET'], $pdo);
        });
        $this->getJson('/api/testing-database-failure')->assertStatus(500)->assertExactJson(['message' => 'Server Error']);
    }
}
