<?php

namespace Tests\Feature;

use App\Events\MessageSent;
use App\Models\Comment;
use App\Models\Conversation;
use App\Models\FileAttachment;
use App\Models\Group;
use App\Models\GroupUser;
use App\Models\Message;
use App\Models\Post;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Passport\ClientRepository;
use Tests\Concerns\UsesPassportKeys;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;
    use UsesPassportKeys;

    protected function setUp(): void
    {
        parent::setUp();
        $this->initializePassportKeys();
        config(['passport.personal_access_client.id' => null, 'passport.personal_access_client.secret' => null]);
        $this->app->make(ClientRepository::class)->createPersonalAccessClient(null, 'Security test', 'http://localhost');
        Notification::fake();
        Event::fake([MessageSent::class]);
    }

    public function test_registration_hashes_password_and_ignores_supplied_identity_and_role(): void
    {
        $response = $this->request('POST', '/api/auth/register', null, [
            'first_name' => 'Security', 'last_name' => 'Test', 'user_name' => 'security_test',
            'email' => 'registration@example.test', 'password' => 'password123',
            'password_confirmation' => 'password123', 'id' => (string) Str::uuid(), 'is_admin' => true,
        ])->assertCreated();
        $user = User::where('email', 'registration@example.test')->firstOrFail();
        $this->assertTrue(Hash::check('password123', $user->password));
        $this->assertFalse((bool) $user->is_admin);
        $this->assertArrayNotHasKey('password', $response->json('data.user'));
        $this->assertArrayNotHasKey('remember_token', $response->json('data.user'));
        $this->assertLessThanOrEqual(31, now()->diffInDays($user->tokens()->first()->expires_at));
        $this->request('GET', '/api/auth/me', $response->json('data.token'))->assertOk();
    }

    public function test_invalid_login_is_account_neutral_and_short_wrong_password_is_rejected(): void
    {
        [$user] = $this->account();
        $known = $this->request('POST', '/api/auth/login', null, ['email' => $user->email, 'password' => 'wrong'])->assertUnauthorized();
        $unknown = $this->request('POST', '/api/auth/login', null, ['email' => 'unknown@example.test', 'password' => 'wrong'])->assertUnauthorized();
        $this->assertSame($known->json(), $unknown->json());
        $this->assertStringNotContainsString('password123', $known->getContent());
    }

    public function test_password_creation_and_recovery_share_the_login_size_limit(): void
    {
        [$user, $token] = $this->account();
        $password = str_repeat('a', 4097);
        $credentials = ['email' => $user->email, 'password' => $password, 'password_confirmation' => $password];
        $this->request('POST', '/api/auth/register', null, array_merge($credentials, [
            'email' => 'oversized@example.test', 'user_name' => 'oversized', 'first_name' => 'Size', 'last_name' => 'Test',
        ]))->assertStatus(400);
        $this->assertDatabaseMissing('users', ['email' => 'oversized@example.test']);
        $this->request('POST', '/api/auth/login', null, $credentials)->assertStatus(400);
        $this->request('POST', '/api/auth/change-password', $token, array_merge($credentials, ['current_password' => 'password123']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->request('POST', '/api/auth/reset-password', null, array_merge($credentials, ['token' => 'invalid']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
        $this->assertTrue(Hash::check('password123', $user->fresh()->password));
    }

    public function test_failed_token_issuance_rolls_back_registration(): void
    {
        $factory = \Mockery::mock(\Laravel\Passport\PersonalAccessTokenFactory::class);
        $factory->shouldReceive('make')->once()->andThrow(new \RuntimeException('Token service unavailable'));
        $this->app->instance(\Laravel\Passport\PersonalAccessTokenFactory::class, $factory);
        $this->request('POST', '/api/auth/register', null, [
            'first_name' => 'Failed', 'last_name' => 'Signup', 'user_name' => 'failed_signup',
            'email' => 'failed@example.test', 'password' => 'password123', 'password_confirmation' => 'password123',
        ])->assertStatus(500);
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('profiles', 0);
    }

    public function test_protected_resources_require_real_bearer_authentication(): void
    {
        $id = (string) Str::uuid();
        foreach (['/api/auth/me', '/api/posts', '/api/users/'.$id, '/api/groups/'.$id,
            '/api/conversations/'.$id.'/messages', '/api/messages/'.$id, '/api/notifications',
            '/api/message-attachments/'.$id] as $path) {
            $this->request('GET', $path)->assertUnauthorized();
        }
        $this->request('POST', '/api/broadcasting/auth', null, ['channel_name' => 'presence-online', 'socket_id' => '1.1'])->assertUnauthorized();
        $this->request('GET', '/api/posts', 'invalid-token')->assertUnauthorized();
    }

    public function test_logout_revokes_only_that_token(): void
    {
        [$user, $token] = $this->account();
        $other = $user->createToken('Other session')->accessToken;
        $this->request('POST', '/api/auth/logout', $token)->assertOk();
        $this->request('GET', '/api/auth/me', $token)->assertUnauthorized();
        $this->request('GET', '/api/auth/me', $other)->assertOk();
    }

    public function test_password_change_requires_current_password_and_revokes_other_sessions(): void
    {
        [$user, $token] = $this->account();
        $other = $user->createToken('Other session')->accessToken;
        $data = ['current_password' => 'incorrect', 'password' => 'newpassword456', 'password_confirmation' => 'newpassword456'];
        $this->request('POST', '/api/auth/change-password', $token, $data)->assertUnprocessable();
        $this->assertTrue(Hash::check('password123', $user->fresh()->password));
        $data['current_password'] = 'password123';
        $this->request('POST', '/api/auth/change-password', $token, $data)->assertOk();
        $this->assertTrue(Hash::check('newpassword456', $user->fresh()->password));
        $this->request('GET', '/api/auth/me', $other)->assertUnauthorized();
        $this->request('GET', '/api/auth/me', $token)->assertOk();
    }

    public function test_password_reset_is_single_use_and_revokes_all_sessions(): void
    {
        [$user, $token] = $this->account();
        $reset = Password::createToken($user);
        $data = ['email' => $user->email, 'token' => $reset, 'password' => 'resetpassword789', 'password_confirmation' => 'resetpassword789'];
        $this->request('POST', '/api/auth/reset-password', null, $data)->assertOk();
        $this->assertTrue(Hash::check('resetpassword789', $user->fresh()->password));
        $this->request('GET', '/api/auth/me', $token)->assertUnauthorized();
        $used = $this->request('POST', '/api/auth/reset-password', null, $data)->assertUnprocessable();
        $data['email'] = 'unknown@example.test';
        $unknown = $this->request('POST', '/api/auth/reset-password', null, $data)->assertUnprocessable();
        $this->assertSame($used->json(), $unknown->json());
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => $user->email]);
    }

    public function test_expired_reset_token_does_not_change_password(): void
    {
        [$user] = $this->account();
        $token = Password::createToken($user);
        $this->travel(61)->minutes();
        $this->request('POST', '/api/auth/reset-password', null, [
            'email' => $user->email, 'token' => $token, 'password' => 'expiredpassword', 'password_confirmation' => 'expiredpassword',
        ])->assertUnprocessable();
        $this->assertTrue(Hash::check('password123', $user->fresh()->password));
    }

    public function test_forgot_password_has_same_response_for_known_unknown_and_throttled_account(): void
    {
        [$user] = $this->account();
        $first = $this->request('POST', '/api/auth/forgot-password', null, ['email' => $user->email])->assertOk();
        $repeat = $this->request('POST', '/api/auth/forgot-password', null, ['email' => $user->email])->assertOk();
        $unknown = $this->request('POST', '/api/auth/forgot-password', null, ['email' => 'unknown@example.test'])->assertOk();
        $this->assertSame($first->json(), $repeat->json());
        $this->assertSame($first->json(), $unknown->json());
        Notification::assertSentTo($user, \Illuminate\Auth\Notifications\ResetPassword::class);
    }

    public function test_public_auth_endpoints_share_a_ten_per_minute_ip_budget(): void
    {
        $routes = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'];
        for ($i = 0; $i < 10; $i++) {
            $this->assertNotSame(429, $this->request('POST', $routes[$i % 4])->status());
        }
        foreach ($routes as $path) {
            $this->request('POST', $path)->assertStatus(429)->assertHeader('Retry-After');
        }
        $this->travel(61)->seconds();
        $this->assertNotSame(429, $this->request('POST', '/api/auth/login')->status());
    }

    public function test_email_header_injection_is_rejected_before_mail_delivery(): void
    {
        $this->request('POST', '/api/auth/forgot-password', null, ['email' => "user@example.test\r\nBcc: other@example.test"])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        Notification::assertNothingSent();
    }

    public function test_authenticated_api_limit_is_per_user_not_shared_ip(): void
    {
        [, $first] = $this->account();
        [, $second] = $this->account();
        for ($i = 0; $i < 120; $i++) {
            $this->request('GET', '/api/notifications/unread-count', $first)->assertOk();
        }
        $this->request('GET', '/api/notifications/unread-count', $first)->assertStatus(429);
        $this->request('GET', '/api/notifications/unread-count', $second)->assertOk();
    }

    public function test_social_redirect_and_callback_fail_closed_without_creating_accounts(): void
    {
        foreach (['google', 'facebook'] as $provider) {
            foreach (['redirect', 'callback?code=untrusted&state=untrusted&redirect=https://attacker.invalid'] as $action) {
                $this->request('GET', "/api/auth/{$provider}/{$action}")->assertStatus(503)->assertHeaderMissing('Location');
            }
        }
        $this->request('GET', '/api/auth/unknown/redirect')->assertNotFound();
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('oauth_access_tokens', 0);
    }

    public function test_post_comment_profile_and_notification_ownership(): void
    {
        [$owner] = $this->account();
        [$outsider, $token] = $this->account();
        $post = Post::create(['user_id' => $owner->id, 'content' => 'Private ownership']);
        $comment = Comment::create(['user_id' => $owner->id, 'post_id' => $post->id, 'content' => 'Comment']);
        $notification = $owner->notifications()->create(['id' => (string) Str::uuid(), 'type' => 'test', 'data' => []]);
        $this->request('PUT', '/api/posts/'.$post->id, $token, ['content' => 'Hijacked'])->assertForbidden();
        $this->request('DELETE', '/api/post/'.$post->id, $token)->assertForbidden();
        $this->request('PUT', '/api/comments/'.$comment->id, $token, ['content' => 'Hijacked'])->assertForbidden();
        $this->request('DELETE', '/api/comments/'.$comment->id, $token)->assertForbidden();
        $this->request('POST', '/api/notifications/'.$notification->id.'/read', $token)->assertNotFound();
        $this->request('PUT', '/api/profile', $token, ['user_id' => $owner->id, 'first_name' => 'Changed'])->assertOk();
        $this->assertSame('Security', $owner->fresh()->profile->first_name);
        $this->assertSame('Changed', $outsider->fresh()->profile->first_name);
    }

    public function test_conversation_and_broadcast_authorization(): void
    {
        [$first, $token] = $this->account();
        [$second] = $this->account();
        [, $outsider] = $this->account();
        $conversation = Conversation::create(['user_id1' => $first->id, 'user_id2' => $second->id]);
        $this->request('GET', '/api/conversations/'.$conversation->id.'/messages', $outsider)->assertForbidden();
        $this->request('POST', '/api/conversations/'.$conversation->id.'/read', $outsider)->assertForbidden();
        // Pusher auth signs locally; these tests never open an external socket.
        config(['broadcasting.default' => 'pusher', 'broadcasting.connections.pusher.key' => 'test-key',
            'broadcasting.connections.pusher.secret' => 'test-secret', 'broadcasting.connections.pusher.app_id' => 'test-id']);
        // Channel callbacks were registered on the test log driver at boot.
        // Register the real rules on the signing driver selected for this test.
        require base_path('routes/channels.php');
        $channels = ['private-conversations.'.$conversation->id, 'private-App.Models.User.'.$first->id];
        foreach ($channels as $channel) {
            $body = ['channel_name' => $channel, 'socket_id' => '1.2'];
            $this->request('POST', '/api/broadcasting/auth', $outsider, $body)->assertForbidden();
            $this->request('POST', '/api/broadcasting/auth', $token, $body)->assertOk()->assertJsonStructure(['auth']);
        }
        $group = Group::create(['name' => 'Channel group', 'owner_id' => $first->id]);
        GroupUser::create(['group_id' => $group->id, 'user_id' => $first->id]);
        $body = ['channel_name' => 'private-groups.'.$group->id, 'socket_id' => '1.2'];
        $this->request('POST', '/api/broadcasting/auth', $outsider, $body)->assertForbidden();
        $this->request('POST', '/api/broadcasting/auth', $token, $body)->assertOk();
    }

    public function test_message_upload_is_private_and_download_requires_participation(): void
    {
        Storage::fake('public');
        Storage::fake('message_attachments');
        [$first, $token] = $this->account();
        [$second, $receiver] = $this->account();
        [, $outsider] = $this->account();
        $response = $this->request('POST', '/api/messages', $token, [
            'receiver_id' => $second->id, 'sender_id' => $second->id,
            'files' => [$this->png('untrusted.txt')],
        ])->assertCreated();
        $response->assertJsonPath('data.message.sender_id', $first->id);
        $file = $response->json('data.message.file_attachments.0');
        $this->assertStringEndsWith('.png', $file['path']);
        $this->assertSame('image/png', $file['mime']);
        $this->assertStringContainsString('/api/message-attachments/'.$file['id'], $file['url']);
        Storage::disk('public')->assertMissing($file['path']);
        Storage::disk('message_attachments')->assertExists($file['path']);
        $path = '/api/message-attachments/'.$file['id'];
        $this->request('GET', $path)->assertUnauthorized();
        $this->request('GET', $path, $outsider)->assertForbidden();
        foreach ([$token, $receiver] as $participant) {
            $this->request('GET', $path, $participant)->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff')
                ->assertHeader('Content-Type', 'application/octet-stream');
        }
    }

    public function test_removed_group_sender_cannot_read_or_replay_attachment(): void
    {
        Storage::fake('message_attachments');
        [$owner] = $this->account();
        [$member, $token] = $this->account();
        $group = Group::create(['name' => 'Private group', 'owner_id' => $owner->id]);
        GroupUser::create(['group_id' => $group->id, 'user_id' => $member->id]);
        $data = ['group_id' => $group->id, 'client_uuid' => (string) Str::uuid(), 'files' => [$this->png('image.png')]];
        $created = $this->request('POST', '/api/messages', $token, $data)->assertCreated();
        GroupUser::where('group_id', $group->id)->where('user_id', $member->id)->delete();
        $this->request('GET', '/api/messages/'.$created->json('data.message.id'), $token)->assertForbidden();
        $this->request('GET', '/api/message-attachments/'.$created->json('data.message.file_attachments.0.id'), $token)->assertForbidden();
        $data['files'] = [$this->png('image.png')];
        $this->request('POST', '/api/messages', $token, $data)->assertForbidden();
    }

    public function test_deleted_group_does_not_restore_removed_sender_access(): void
    {
        Storage::fake('message_attachments');
        [$owner, $ownerToken] = $this->account();
        [$member, $memberToken] = $this->account();
        $groupId = $this->request('POST', '/api/group', $ownerToken, ['name' => 'Deleted private group'])
            ->assertCreated()->json('data.id');
        $this->request('POST', '/api/group/'.$groupId.'/add-user', $ownerToken, ['user_id' => $member->id])->assertCreated();
        $clientUuid = (string) Str::uuid();
        $created = $this->request('POST', '/api/messages', $memberToken, [
            'group_id' => $groupId, 'client_uuid' => $clientUuid, 'files' => [$this->png('image.png')],
        ])->assertCreated();
        $messageId = $created->json('data.message.id');
        $attachmentId = $created->json('data.message.file_attachments.0.id');
        $this->request('POST', '/api/group/'.$groupId.'/remove-user', $ownerToken, ['user_id' => $member->id])->assertOk();
        $this->request('DELETE', '/api/group/'.$groupId, $ownerToken)->assertOk();
        $this->assertNull(Message::findOrFail($messageId)->group_id);
        $this->request('GET', '/api/messages/'.$messageId, $memberToken)->assertForbidden();
        $this->request('GET', '/api/message-attachments/'.$attachmentId, $memberToken)->assertForbidden();
        // A different valid target must not turn a replay key into access to
        // the old, now-orphaned group message.
        $this->request('POST', '/api/messages', $memberToken, [
            'receiver_id' => $owner->id, 'client_uuid' => $clientUuid, 'message' => 'Replay',
        ])->assertForbidden();
        $this->assertDatabaseCount('messages', 1);
    }

    public function test_attachment_path_traversal_and_post_ids_are_not_accepted(): void
    {
        [$user, $token] = $this->account();
        [$receiver] = $this->account();
        $conversation = Conversation::create(['user_id1' => $user->id, 'user_id2' => $receiver->id]);
        $message = Message::create(['sender_id' => $user->id, 'receiver_id' => $receiver->id, 'conversation_id' => $conversation->id, 'message' => 'Fixture']);
        $file = FileAttachment::create(['message_id' => $message->id, 'path' => '../../.env', 'name' => 'bad', 'mime' => 'text/plain', 'size' => 1]);
        $this->request('GET', '/api/message-attachments/'.$file->id, $token)->assertNotFound();
        $post = Post::create(['user_id' => $user->id, 'content' => 'Post']);
        $public = FileAttachment::create(['post_id' => $post->id, 'path' => 'uploads/posts/file.png', 'name' => 'image', 'mime' => 'image/png', 'size' => 1]);
        $this->request('GET', '/api/message-attachments/'.$public->id, $token)->assertNotFound();
    }

    public function test_uploads_reject_svg_executables_oversized_files_and_ambiguous_targets(): void
    {
        [$user, $token] = $this->account();
        [$receiver] = $this->account();
        $group = Group::create(['name' => 'Validation group', 'owner_id' => $user->id]);
        foreach (['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', '<?php echo "unsafe";'] as $bytes) {
            foreach (['/api/profile/avatar' => 'avatar', '/api/post' => 'file', '/api/messages' => 'files', '/api/group' => 'profile_picture'] as $route => $field) {
                $file = UploadedFile::fake()->createWithContent('file.svg', $bytes);
                $body = [$field => in_array($field, ['file', 'files']) ? [$file] : $file, 'receiver_id' => $receiver->id, 'name' => 'Upload test'];
                $this->request('POST', $route, $token, $body)->assertUnprocessable();
            }
        }
        $this->request('POST', '/api/messages', $token, ['receiver_id' => $receiver->id, 'files' => [UploadedFile::fake()->create('large.pdf', 20481, 'application/pdf')]])->assertUnprocessable();
        $this->request('POST', '/api/messages', $token, ['receiver_id' => $receiver->id, 'group_id' => $group->id, 'message' => 'Ambiguous'])->assertUnprocessable();
    }

    public function test_legacy_media_migration_preserves_content_and_does_not_overwrite_conflicts(): void
    {
        Storage::fake('public');
        Storage::fake('message_attachments');
        $path = 'uploads/messages/'.Str::uuid().'.png';
        Storage::disk('public')->put($path, 'original bytes');
        $this->artisan('media:privatize-messages')->assertSuccessful();
        Storage::disk('public')->assertExists($path);
        $this->artisan('media:privatize-messages', ['--apply' => true])->assertSuccessful();
        Storage::disk('public')->assertMissing($path);
        $this->assertSame('original bytes', Storage::disk('message_attachments')->get($path));
        Storage::disk('public')->put($path, 'conflicting bytes');
        $this->artisan('media:privatize-messages', ['--apply' => true])->assertFailed();
        $this->assertSame('conflicting bytes', Storage::disk('public')->get($path));
        $this->assertSame('original bytes', Storage::disk('message_attachments')->get($path));
    }

    private function account(): array
    {
        $user = User::factory()->create(['password' => Hash::make('password123')]);
        Profile::create(['user_id' => $user->id, 'first_name' => 'Security', 'last_name' => 'Test']);

        return [$user, $user->createToken('Security test')->accessToken];
    }

    private function request(string $method, string $path, ?string $token = null, array $data = [])
    {
        $this->app['auth']->forgetGuards();

        return $this->json($method, $path, $data, $token ? ['Authorization' => 'Bearer '.$token] : []);
    }

    private function png(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII='
        ))->mimeType('image/png');
    }
}
