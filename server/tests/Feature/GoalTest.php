<?php

namespace Tests\Feature;

use App\Models\Goal;
use App\Models\GoalMilestone;
use App\Models\User;
use App\Services\Database\IntegrityPreflight;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Passport\Passport;
use Tests\TestCase;

class GoalTest extends TestCase
{
    use RefreshDatabase;

    private function actor(): User
    {
        $user = User::factory()->withProfile()->create();
        Passport::actingAs($user);
        return $user;
    }

    private function payload(array $extra = []): array
    {
        return array_merge(['title' => 'Read 12 books', 'measurement_type' => 'count', 'target_value' => '12.250', 'unit' => 'books'], $extra);
    }

    public function test_creation_uses_authenticated_owner_exact_target_and_calendar_date(): void
    {
        $owner = $this->actor();
        $goal = $this->postJson('/api/goals', $this->payload(['target_date' => '2026-12-31', 'title' => '  Read books  ']))
            ->assertCreated()->assertJsonPath('status', 'success')->assertJsonPath('data.user_id', $owner->id)
            ->assertJsonPath('data.title', 'Read books')->assertJsonPath('data.target_value', '12.250')
            ->assertJsonPath('data.target_date', '2026-12-31')->assertJsonPath('data.visibility', 'private')
            ->assertJsonPath('data.status', 'active')->json('data');
        $this->assertTrue(\Illuminate\Support\Str::isUuid($goal['id']));
        $this->assertSame('2026-12-31', DB::table('goals')->value('target_date'));
        $this->assertArrayNotHasKey('progress_percentage', $goal);
    }

    public function test_generic_writes_cannot_change_identity_lifecycle_or_measurement_type(): void
    {
        $owner = $this->actor();
        foreach (['user_id', 'id', 'status', 'completed_at', 'archived_at', 'milestones', 'progress_percentage'] as $field) {
            $this->postJson('/api/goals', $this->payload([$field => 'injected']))->assertUnprocessable();
        }
        $goal = Goal::factory()->for($owner)->create();
        foreach (['user_id', 'status', 'completed_at', 'measurement_type'] as $field) {
            $this->patchJson('/api/goals/'.$goal->id, [$field => $field === 'measurement_type' ? null : 'injected'])->assertUnprocessable();
        }
        $this->assertSame('active', $goal->fresh()->status);
        $this->assertSame('boolean', $goal->fresh()->measurement_type);
    }

    public function test_measurement_target_and_date_validation_rejects_invalid_boundaries(): void
    {
        $this->actor();
        foreach ([null, 0, -1, '0.0001', '1000000000', '1e3', 'NaN', '12.1234'] as $target) {
            $this->postJson('/api/goals', $this->payload(['target_value' => $target]))->assertUnprocessable();
        }
        foreach (['2026-02-30', '2026-12-31T00:00:00Z', '31-12-2026', '0999-01-01'] as $date) {
            $this->postJson('/api/goals', $this->payload(['target_date' => $date]))->assertUnprocessable();
        }
        foreach ([['title' => ' '], ['title' => str_repeat('x', 161)], ['description' => str_repeat('x', 5001)], ['unit' => ' '], ['unit' => str_repeat('x', 33)], ['visibility' => 'followers'], ['measurement_type' => 'unknown']] as $bad) {
            $this->postJson('/api/goals', $this->payload($bad))->assertUnprocessable();
        }
        $this->postJson('/api/goals', ['title' => 'Launch', 'measurement_type' => 'boolean', 'target_value' => '1'])->assertUnprocessable();
        $this->postJson('/api/goals', $this->payload(['measurement_type' => 'duration', 'unit' => 'hours']))->assertUnprocessable();
        foreach (['boolean', 'milestone'] as $type) {
            $this->postJson('/api/goals', ['title' => 'Plan', 'measurement_type' => $type])->assertCreated()->assertJsonPath('data.target_value', null);
        }
        $this->postJson('/api/goals', $this->payload(['measurement_type' => 'duration', 'unit' => 'minutes', 'target_value' => '0.001']))->assertCreated();
        $this->postJson('/api/goals', $this->payload(['target_value' => '999999999.999', 'target_date' => '2024-02-29']))->assertCreated();
    }

    public function test_updates_merge_measurement_rules_and_allow_clearing_optional_fields(): void
    {
        $owner = $this->actor();
        $goal = Goal::factory()->for($owner)->countGoal()->create();
        $this->patchJson('/api/goals/'.$goal->id, ['target_value' => null])->assertUnprocessable();
        $this->patchJson('/api/goals/'.$goal->id, ['unit' => null])->assertUnprocessable();
        $this->patchJson('/api/goals/'.$goal->id, ['title' => 'Read more', 'target_value' => '20.125', 'description' => null, 'target_date' => null])
            ->assertOk()->assertJsonPath('data.target_value', '20.125')->assertJsonPath('data.target_date', null);
        $this->assertSame('books', $goal->fresh()->unit);
    }

    public function test_lifecycle_is_idempotent_preserves_history_and_requires_reactivation(): void
    {
        $owner = $this->actor();
        $goal = Goal::factory()->for($owner)->create();
        $milestone = GoalMilestone::factory()->for($goal)->completed()->create();
        $base = '/api/goals/'.$goal->id;
        $completed = $this->postJson($base.'/complete')->assertOk()->json('data.completed_at');
        $this->assertNotNull($completed);
        $this->travel(1)->hours();
        $this->postJson($base.'/complete')->assertOk()->assertJsonPath('data.completed_at', $completed);
        $this->patchJson($base, ['title' => 'No'])->assertConflict();
        $this->postJson($base.'/archive')->assertOk()->assertJsonPath('data.completed_at', $completed);
        $archived = $goal->fresh()->archived_at->toISOString();
        $this->postJson($base.'/archive')->assertOk()->assertJsonPath('data.archived_at', $archived);
        $this->postJson($base.'/complete')->assertConflict();
        $this->postJson($base.'/reopen')->assertOk()->assertJsonPath('data.completed_at', null)->assertJsonPath('data.archived_at', null);
        $this->assertNotNull($milestone->fresh()->completed_at);
        $this->assertTrue($goal->fresh()->created_at->equalTo($goal->created_at));
        $this->postJson($base.'/reopen', ['completed_at' => now()->toISOString()])->assertUnprocessable();
        $this->deleteJson($base)->assertStatus(405);
    }

    public function test_private_reads_and_all_outsider_mutations_are_hidden(): void
    {
        $goal = Goal::factory()->create();
        $milestone = GoalMilestone::factory()->for($goal)->create();
        $this->actor();
        $base = '/api/goals/'.$goal->id;
        $this->getJson($base)->assertNotFound();
        $this->getJson($base.'/milestones')->assertNotFound();
        foreach (['private', 'public'] as $visibility) {
            $goal->update(['visibility' => $visibility]);
            $this->patchJson($base, ['title' => 'Stolen'])->assertNotFound();
            foreach (['complete', 'reopen', 'archive'] as $operation) $this->postJson($base.'/'.$operation)->assertNotFound();
            $this->postJson($base.'/milestones', ['title' => 'Stolen'])->assertNotFound();
            $this->patchJson('/api/milestones/'.$milestone->id, ['title' => 'Stolen'])->assertNotFound();
            foreach (['complete', 'reopen'] as $operation) $this->postJson('/api/milestones/'.$milestone->id.'/'.$operation)->assertNotFound();
            $this->deleteJson('/api/milestones/'.$milestone->id)->assertNotFound();
        }
        $this->getJson($base)->assertOk()->assertJsonMissingPath('data.user')->assertJsonMissingPath('data.email');
        $this->getJson($base.'/milestones')->assertOk()->assertJsonPath('data.total', 1);
        $this->getJson('/api/goals')->assertOk()->assertJsonPath('data.total', 0);
        $this->getJson('/api/goals?user_id='.$goal->user_id)->assertUnprocessable();
    }

    public function test_guests_cannot_access_even_public_goals(): void
    {
        $goal = Goal::factory()->public()->create();
        $this->getJson('/api/goals')->assertUnauthorized();
        $this->getJson('/api/goals/'.$goal->id)->assertUnauthorized();
        $this->getJson('/api/goals/'.$goal->id.'/milestones')->assertUnauthorized();
        $this->postJson('/api/goals', $this->payload())->assertUnauthorized();
    }

    public function test_milestone_order_mutation_completion_and_deletion(): void
    {
        $owner = $this->actor();
        $goal = Goal::factory()->for($owner)->milestoneGoal()->create();
        $base = '/api/goals/'.$goal->id.'/milestones';
        $first = $this->postJson($base, ['title' => 'First'])->assertCreated()->assertJsonPath('data.position', 1)->json('data.id');
        $second = $this->postJson($base, ['title' => 'Second'])->assertCreated()->assertJsonPath('data.position', 2)->json('data.id');
        $this->postJson($base, ['title' => 'Duplicate', 'position' => 1])->assertUnprocessable();
        foreach ([0, -1, 1.5, 1000001] as $position) $this->postJson($base, ['title' => 'Invalid', 'position' => $position])->assertUnprocessable();
        $this->postJson($base, ['title' => 'Forged', 'goal_id' => $goal->id])->assertUnprocessable();
        $this->patchJson('/api/milestones/'.$first, ['position' => 2])->assertUnprocessable();
        $this->patchJson('/api/milestones/'.$first, ['position' => 5, 'title' => 'Later'])->assertOk();
        $this->getJson($base.'?per_page=1')->assertOk()->assertJsonPath('data.data.0.id', $second)->assertJsonPath('data.total', 2);
        $done = $this->postJson('/api/milestones/'.$first.'/complete')->assertOk()->json('data.completed_at');
        $this->postJson('/api/milestones/'.$first.'/complete')->assertOk()->assertJsonPath('data.completed_at', $done);
        $this->postJson('/api/milestones/'.$first.'/reopen')->assertOk()->assertJsonPath('data.completed_at', null);
        $this->patchJson('/api/milestones/'.$first, ['completed_at' => now()->toISOString()])->assertUnprocessable();
        $this->postJson('/api/goals/'.$goal->id.'/archive')->assertOk();
        $this->deleteJson('/api/milestones/'.$first)->assertConflict();
        $this->postJson('/api/goals/'.$goal->id.'/reopen')->assertOk();
        $this->deleteJson('/api/milestones/'.$first)->assertOk();
        $this->assertDatabaseMissing('goal_milestones', ['id' => $first]);
    }

    public function test_lists_are_owner_scoped_filtered_bounded_and_deterministic(): void
    {
        $owner = $this->actor();
        Goal::factory()->for($owner)->count(3)->create();
        Goal::factory()->for($owner)->public()->completed()->create();
        Goal::factory()->for($owner)->archived()->create();
        Goal::factory()->public()->count(2)->create();
        $this->getJson('/api/goals?per_page=999')->assertOk()->assertJsonPath('data.total', 4)->assertJsonPath('data.per_page', 50);
        $this->getJson('/api/goals?status=archived')->assertOk()->assertJsonPath('data.total', 1);
        $this->getJson('/api/goals?status=completed&visibility=public')->assertOk()->assertJsonPath('data.total', 1);
        $first = $this->getJson('/api/goals?per_page=2')->assertOk()->json('data.data');
        $second = $this->getJson('/api/goals?per_page=2&page=2')->assertOk()->json('data.data');
        $this->assertCount(4, array_unique(array_column(array_merge($first, $second), 'id')));
        foreach (['page=0', 'per_page=0', 'status=invalid', 'visibility=followers', 'search=private'] as $filter) $this->getJson('/api/goals?'.$filter)->assertUnprocessable();
    }

    public function test_factories_satisfy_preflight_and_sqlite_constraints(): void
    {
        foreach (['active', 'completed', 'archived', 'public', 'private', 'countGoal', 'durationGoal', 'milestoneGoal'] as $state) Goal::factory()->$state()->create();
        GoalMilestone::factory()->completed()->create();
        $this->assertTrue(app(IntegrityPreflight::class)->inspect(0)['ok']);
        $goal = Goal::firstOrFail();
        $this->expectException(QueryException::class);
        DB::table('goals')->where('id', $goal->id)->update(['status' => 'invalid']);
    }

    public function test_foreign_keys_restrict_parent_deletion(): void
    {
        $goal = Goal::factory()->create();
        GoalMilestone::factory()->for($goal)->create();
        $this->expectException(QueryException::class);
        $goal->delete();
    }
}
