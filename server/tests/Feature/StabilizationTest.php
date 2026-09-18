<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Models\Group;
use App\Models\GroupUser;
use App\Models\Profile;
use App\Models\User;
use App\Repositories\GroupUserRepository;
use App\Services\GroupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Laravel\Passport\Passport;
use Mockery;
use Tests\TestCase;

class StabilizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_group_routes_require_authentication(): void
    {
        $this->postJson('/api/group', ['name' => 'Private group'])->assertUnauthorized();
    }

    public function test_outsiders_cannot_read_or_manage_another_group(): void
    {
        [$owner, $group] = $this->group();
        $outsider = User::factory()->create();
        Passport::actingAs($outsider);

        $this->getJson("/api/groups/{$group->id}")->assertForbidden();
        $this->getJson("/api/users/{$owner->id}/groups")->assertForbidden();
        $this->getJson("/api/groups/{$group->id}/messages")->assertForbidden();
        $this->putJson("/api/group/{$group->id}", ['name' => 'Hijacked'])->assertForbidden();
        $this->deleteJson("/api/group/{$group->id}")->assertForbidden();
        $this->postJson("/api/group/{$group->id}/add-user", ['user_id' => $outsider->id])->assertForbidden();
        $this->postJson("/api/group/{$group->id}/remove-user", ['user_id' => $owner->id])->assertForbidden();

        $this->assertDatabaseHas('groups', ['id' => $group->id, 'name' => 'Private group', 'owner_id' => $owner->id]);
        $this->assertDatabaseMissing('group_users', ['group_id' => $group->id, 'user_id' => $outsider->id]);
    }

    public function test_members_can_read_but_cannot_manage_a_group(): void
    {
        [, $group] = $this->group();
        $member = User::factory()->create();
        GroupUser::create(['group_id' => $group->id, 'user_id' => $member->id]);
        Passport::actingAs($member);

        $this->getJson("/api/groups/{$group->id}")->assertOk();
        $this->getJson("/api/users/{$member->id}/groups")->assertOk();
        $this->getJson("/api/groups/{$group->id}/messages")->assertOk();
        $this->putJson("/api/group/{$group->id}", ['name' => 'Renamed'])->assertForbidden();
        $this->deleteJson("/api/group/{$group->id}")->assertForbidden();
    }

    public function test_owner_can_update_only_editable_group_fields(): void
    {
        [$owner, $group] = $this->group();
        $other = User::factory()->create();
        Passport::actingAs($owner);

        $this->putJson("/api/group/{$group->id}", [
            'name' => 'Renamed group',
            'description' => 'A meaningful description',
            'owner_id' => $other->id,
            'last_message_id' => $other->id,
        ])->assertOk();

        $this->assertDatabaseHas('groups', [
            'id' => $group->id,
            'name' => 'Renamed group',
            'owner_id' => $owner->id,
            'last_message_id' => null,
        ]);
        $this->deleteJson("/api/group/{$group->id}")->assertOk();
        $this->assertDatabaseMissing('groups', ['id' => $group->id]);
    }

    public function test_owner_can_manage_members_without_duplicate_membership_or_removing_owner(): void
    {
        [$owner, $group] = $this->group();
        $member = User::factory()->create();
        Passport::actingAs($owner);

        $this->postJson("/api/group/{$group->id}/add-user", ['user_id' => $member->id])->assertCreated();
        $this->postJson("/api/group/{$group->id}/add-user", ['user_id' => $member->id])->assertCreated();
        $this->assertSame(1, GroupUser::where('group_id', $group->id)->where('user_id', $member->id)->count());
        $this->postJson("/api/group/{$group->id}/remove-user", ['user_id' => $owner->id])
            ->assertUnprocessable()->assertJsonValidationErrors('user_id');
        $this->postJson("/api/group/{$group->id}/remove-user", ['user_id' => $member->id])->assertOk();
        $this->assertDatabaseMissing('group_users', ['group_id' => $group->id, 'user_id' => $member->id]);
    }

    public function test_group_inputs_are_validated(): void
    {
        [$owner, $group] = $this->group();
        Passport::actingAs($owner);

        $this->postJson('/api/group', ['name' => ['invalid']])->assertUnprocessable()->assertJsonValidationErrors('name');
        $this->postJson('/api/group', ['name' => str_repeat('a', 256)])->assertUnprocessable();
        $this->putJson("/api/group/{$group->id}", ['name' => ['invalid']])->assertUnprocessable();
        $this->postJson("/api/group/{$group->id}/add-user", [])->assertUnprocessable()->assertJsonValidationErrors('user_id');
        $this->postJson("/api/group/{$group->id}/remove-user", ['user_id' => 'invalid'])->assertUnprocessable();
    }

    public function test_group_creation_persists_picture_and_authenticated_owner_membership(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        Passport::actingAs($owner);

        $response = $this->postJson('/api/group', [
            'name' => 'New group',
            'owner_id' => 'untrusted-owner',
            'profile_picture' => $this->png('picture.txt'),
        ])->assertCreated()->assertJsonPath('data.owner_id', $owner->id);

        $groupId = $response->json('data.id');
        $this->assertDatabaseHas('group_users', ['group_id' => $groupId, 'user_id' => $owner->id]);
        $this->assertStringEndsWith('.png', $response->json('data.profile_picture'));
        $this->assertCount(1, Storage::disk('public')->allFiles('uploads/groups'));
    }

    public function test_group_creation_rolls_back_and_cleans_picture_when_membership_fails(): void
    {
        Storage::fake('public');
        $owner = User::factory()->create();
        $memberships = Mockery::mock(GroupUserRepository::class);
        $memberships->shouldReceive('addUserToGroup')->once()->andThrow(new \RuntimeException('Membership failed'));
        $this->app->instance(GroupUserRepository::class, $memberships);

        try {
            $this->app->make(GroupService::class)->createGroup([
                'name' => 'Failed group', 'owner_id' => $owner->id,
            ], $this->png('picture.png'));
            $this->fail('The membership error must propagate.');
        } catch (\RuntimeException $e) {
            $this->assertSame('Membership failed', $e->getMessage());
        }

        $this->assertDatabaseMissing('groups', ['name' => 'Failed group']);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_group_message_updates_the_list_preview(): void
    {
        Event::fake([MessageSent::class]);
        [$owner, $group] = $this->group();
        Passport::actingAs($owner);

        $response = $this->postJson('/api/messages', [
            'group_id' => $group->id, 'message' => 'Today I made progress.',
        ])->assertCreated();

        $this->assertDatabaseHas('groups', ['id' => $group->id, 'last_message_id' => $response->json('data.message.id')]);
        $this->getJson("/api/users/{$owner->id}/groups")->assertOk()->assertJsonPath('data.0.last_message', 'Today I made progress.');
    }

    public function test_profiles_keep_uuid_identity_during_updates(): void
    {
        $user = User::factory()->create();
        $profile = Profile::create(['user_id' => $user->id, 'first_name' => 'Before', 'last_name' => 'Name']);
        $this->assertIsString($profile->id);
        $this->assertMatchesRegularExpression('/^[0-9a-f-]{36}$/', $profile->id);
        Passport::actingAs($user);

        $this->putJson('/api/profile', ['first_name' => 'After'])->assertOk();
        $this->assertDatabaseHas('profiles', ['id' => $profile->id, 'first_name' => 'After']);
    }

    public function test_avatar_without_a_profile_returns_error_without_orphaning_a_file(): void
    {
        Storage::fake('public');
        Passport::actingAs(User::factory()->create());

        $this->postJson('/api/profile/avatar', ['avatar' => $this->png('avatar.png')])->assertNotFound();
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_post_upload_uses_detected_extension_and_mime(): void
    {
        Storage::fake('public');
        Passport::actingAs(User::factory()->create());

        $response = $this->postJson('/api/post', ['file' => [$this->png('photo.txt')]])->assertCreated();
        $this->assertStringEndsWith('.png', $response->json('data.post.attachments.0.path'));
        $response->assertJsonPath('data.post.attachments.0.mime', 'image/png');
    }

    public function test_all_paginated_routes_reject_nonpositive_page_sizes(): void
    {
        $user = User::factory()->create();
        Passport::actingAs($user);
        $routes = [
            '/api/posts', "/api/user/{$user->id}/posts", '/api/posts/search?query=progress',
            "/api/posts/{$user->id}/comments", "/api/posts/{$user->id}/likes", '/api/notifications',
            "/api/conversations/{$user->id}/messages", "/api/groups/{$user->id}/messages",
        ];

        foreach ($routes as $route) {
            $separator = str_contains($route, '?') ? '&' : '?';
            $this->getJson($route.$separator.'per_page=-1')->assertUnprocessable()->assertJsonValidationErrors('per_page');
        }
        $this->getJson('/api/posts?per_page=0')->assertUnprocessable();
        $this->getJson('/api/posts?per_page=invalid')->assertUnprocessable();
        $this->getJson('/api/posts?per_page=100')->assertOk()->assertJsonPath('data.per_page', 50);
    }

    private function group(): array
    {
        $owner = User::factory()->create();
        $group = Group::create(['name' => 'Private group', 'owner_id' => $owner->id]);
        GroupUser::create(['group_id' => $group->id, 'user_id' => $owner->id]);

        return [$owner, $group];
    }

    private function png(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII='
        ))->mimeType('image/png');
    }
}
