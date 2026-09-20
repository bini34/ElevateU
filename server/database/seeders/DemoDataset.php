<?php

namespace Database\Seeders;

use App\Models\User;
use App\Notifications\ActivityNotification;
use Database\Factories\FileAttachmentFactory;
use Ramsey\Uuid\Uuid;

/** Versioned fictional records shared by the demo and upgrade rehearsal. */
final class DemoDataset
{
    public static function id(string $kind, int $number): string
    {
        return (string) Uuid::uuid5(Uuid::NAMESPACE_URL, 'https://elevateu.invalid/demo/v1/'.$kind.'/'.$number);
    }

    public static function rows(string $passwordHash): array
    {
        $data = array_fill_keys(['users', 'profiles', 'posts', 'comments', 'likes', 'conversations', 'groups', 'group_users', 'messages', 'file_attachments', 'notifications'], []);
        $time = ['created_at' => '2026-09-01 08:00:00', 'updated_at' => '2026-09-01 08:00:00'];
        $names = [['Mira', 'Vale'], ['Theo', 'Reed'], ['Nia', 'Brook'], ['Arun', 'Lake'], ['Lina', 'Fern'], ['Sam', 'Quill']];
        $posts = [
            'Finished a twenty-minute walk before work. Laying out my shoes last night helped.',
            'Practised guitar slowly today. The chord change is finally getting cleaner.',
            'Read another chapter at the café and wrote down one idea to try this week. 📚',
            'My study session was shorter than planned, but I showed up and made notes.',
            'Cooked a new lentil recipe. Next time I will prep the vegetables earlier.',
            'A quiet evening drawing from observation. I am learning to notice the shadows.',
        ];
        foreach ($names as $i => [$first, $last]) {
            $n = $i + 1;
            $user = self::id('user', $n);
            $data['users'][] = $time + ['id' => $user, 'user_name' => 'demo_'.strtolower($first), 'email' => strtolower($first).'@elevateu.example', 'password' => $passwordHash, 'is_admin' => false];
            $data['profiles'][] = $time + ['id' => self::id('profile', $n), 'user_id' => $user, 'first_name' => $first, 'last_name' => $last, 'bio' => 'Fictional demo member sharing small, consistent steps.'];
            $data['posts'][] = ['created_at' => '2026-09-01 08:00:00.123456'] + $time + ['id' => self::id('post', $n), 'user_id' => $user, 'content' => $posts[$i]];
            $next = self::id('user', ($n % 6) + 1);
            $data['comments'][] = $time + ['id' => self::id('comment', $n), 'user_id' => $next, 'post_id' => self::id('post', $n), 'content' => 'Thanks for sharing the process. What will you try next?'];
            $data['likes'][] = $time + ['id' => self::id('like', $n), 'user_id' => $next, 'post_id' => self::id('post', $n)];
        }
        for ($n = 1; $n <= 2; $n++) {
            $participants = [self::id('user', $n), self::id('user', $n + 2)];
            sort($participants, SORT_STRING);
            $conversation = self::id('conversation', $n);
            $data['conversations'][] = $time + ['id' => $conversation, 'user_id1' => $participants[0], 'user_id2' => $participants[1]];
            foreach (['How did your practice go?', 'I made time for it, even with a busy day.', 'That helps me remember to keep it manageable.'] as $offset => $text) {
                $data['messages'][] = ['created_at' => '2026-09-01 09:00:0'.$offset.'.123456', 'updated_at' => '2026-09-01 09:00:0'.$offset.'.123456'] + [
                    'id' => self::id('direct-message', $n * 10 + $offset), 'message' => $text,
                    'conversation_id' => $conversation, 'sender_id' => $participants[$offset % 2],
                    'receiver_id' => $participants[1 - ($offset % 2)], 'group_id' => null,
                    'client_uuid' => self::id('client-message', $n * 10 + $offset),
                    'read_at' => $offset === 0 ? '2026-09-01 09:01:00' : null,
                ];
            }
            $group = self::id('group', $n);
            $data['groups'][] = $time + ['id' => $group, 'name' => $n === 1 ? 'Morning Practice Circle' : 'Creative Evenings', 'description' => 'A fictional demo community for sharing practice and encouragement.', 'owner_id' => self::id('user', $n)];
            for ($member = $n; $member < $n + 3; $member++) {
                $data['group_users'][] = $time + ['group_id' => $group, 'user_id' => self::id('user', $member)];
                $data['messages'][] = ['created_at' => '2026-09-01 10:00:0'.$member.'.654321', 'updated_at' => '2026-09-01 10:00:0'.$member.'.654321'] + [
                    'id' => self::id('group-message', $n * 10 + $member), 'sender_id' => self::id('user', $member),
                    'group_id' => $group, 'receiver_id' => null, 'conversation_id' => null,
                    'message' => 'Checking in with the group after today\'s practice.',
                ];
            }
            $data['file_attachments'][] = $time + [
                'id' => self::id('attachment', $n), 'post_id' => $n === 1 ? self::id('post', 1) : null,
                'message_id' => $n === 2 ? self::id('direct-message', 20) : null,
                'path' => 'uploads/'.($n === 1 ? 'posts' : 'messages').'/'.self::id('attachment', $n).'.png',
                'name' => 'demo-practice.png', 'mime' => 'image/png', 'size' => strlen(base64_decode(FileAttachmentFactory::PNG)),
            ];
            $data['notifications'][] = $time + [
                'id' => self::id('notification', $n), 'type' => ActivityNotification::class,
                'notifiable_type' => (new User)->getMorphClass(), 'notifiable_id' => self::id('user', $n),
                'data' => json_encode(['kind' => 'post_liked', 'post_id' => self::id('post', $n),
                    'actor' => ['id' => self::id('user', $n + 1), 'user_name' => 'demo_'.strtolower($names[$n][0]), 'name' => implode(' ', $names[$n]), 'avatar' => null],
                    'text' => $names[$n][0].' liked your post',
                ], JSON_THROW_ON_ERROR),
            ];
        }

        return $data;
    }
}
