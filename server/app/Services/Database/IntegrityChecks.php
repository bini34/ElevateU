<?php

namespace App\Services\Database;

use App\Models\User;
use Illuminate\Database\Connection;
use Illuminate\Database\Query\Builder;

/** SELECT-only checks. Projections deliberately exclude content and credentials. */
final class IntegrityChecks
{
    public function __construct(private Connection $db) {}

    /** @return array<string, array{query: Builder, severity: string, meaning: string}> */
    public function queries(): array
    {
        $checks = [];
        $add = function (string $name, Builder $query, string $meaning, string $severity = 'blocking') use (&$checks): void {
            $checks[$name] = compact('query', 'meaning', 'severity');
        };
        foreach ([
            'profiles' => ['user_id'],
            'group_users' => ['group_id', 'user_id'],
            'likes' => ['user_id', 'post_id'],
            'conversations' => ['user_id1', 'user_id2'],
        ] as $table => $columns) {
            $query = $this->db->table($table)->select($columns)->selectRaw('COUNT(*) as copies')
                ->groupBy($columns)->havingRaw('COUNT(*) > 1');
            $add('duplicate_'.$table, $query, 'Duplicate keys (count is key groups, not excess rows).');
        }
        $low = 'CASE WHEN user_id1 < user_id2 THEN user_id1 ELSE user_id2 END';
        $high = 'CASE WHEN user_id1 < user_id2 THEN user_id2 ELSE user_id1 END';
        $pairs = $this->db->table('conversations')->selectRaw("$low as participant_low, $high as participant_high, COUNT(*) as copies")
            ->groupByRaw("$low, $high")->havingRaw('COUNT(*) > 1');
        $add('duplicate_conversation_pairs', clone $pairs, 'Duplicate unordered pairs, including exact and reversed copies.');
        $add('reversed_conversation_pairs', (clone $pairs)->havingRaw('MIN(user_id1) <> MAX(user_id1)'), 'Pairs stored in both participant orders.');
        $add('self_conversations', $this->db->table('conversations')->select('id')->whereColumn('user_id1', 'user_id2'), 'A conversation must have two different users.');
        $add('missing_profiles', $this->db->table('users as u')->select('u.id')->whereNotExists(function ($q) {
            $q->selectRaw('1')->from('profiles as p')->whereColumn('p.user_id', 'u.id');
        }), 'Users without profiles; uniqueness alone cannot guarantee existence.');
        $add('owners_without_membership', $this->db->table('groups as g')->select('g.id')->whereNotExists(function ($q) {
            $q->selectRaw('1')->from('group_users as gu')->whereColumn('gu.group_id', 'g.id')->whereColumn('gu.user_id', 'g.owner_id');
        }), 'A group owner must also have a membership.');

        // Null on optional foreign keys is checked separately by target rules.
        foreach ([
            ['profiles', 'user_id', 'users'], ['posts', 'user_id', 'users'],
            ['comments', 'user_id', 'users'], ['comments', 'post_id', 'posts'],
            ['likes', 'user_id', 'users'], ['likes', 'post_id', 'posts'],
            ['conversations', 'user_id1', 'users'], ['conversations', 'user_id2', 'users'],
            ['groups', 'owner_id', 'users'], ['group_users', 'group_id', 'groups'],
            ['group_users', 'user_id', 'users'], ['messages', 'sender_id', 'users'],
            ['messages', 'receiver_id', 'users'], ['messages', 'conversation_id', 'conversations'],
            ['messages', 'group_id', 'groups'], ['file_attachments', 'message_id', 'messages'],
            ['file_attachments', 'post_id', 'posts'],
        ] as [$table, $column, $parent]) {
            $projection = $table === 'group_users' ? ['r.group_id', 'r.user_id'] : ['r.id'];
            $query = $this->db->table($table.' as r')->select($projection)->whereNotNull('r.'.$column)
                ->whereNotExists(function ($q) use ($column, $parent) {
                    $q->selectRaw('1')->from($parent.' as p')->whereColumn('p.id', 'r.'.$column);
                });
            $add('orphan_'.$table.'_'.$column, $query, 'Non-null reference has no parent.');
        }
        foreach (['comments', 'likes'] as $table) {
            $add($table.'_without_post', $this->db->table($table)->select('id')->whereNull('post_id'), 'Nullable schema allows a record without its required post.');
        }

        $add('invalid_message_targets', $this->db->table('messages')->select('id')->whereRaw(
            'NOT ((group_id IS NOT NULL AND conversation_id IS NULL AND receiver_id IS NULL)'
            .' OR (group_id IS NULL AND conversation_id IS NOT NULL AND receiver_id IS NOT NULL))'
        ), 'Require exactly one group target OR a conversation plus receiver; includes retained deletion orphans.');
        $add('direct_message_participants', $this->db->table('messages as m')
            ->join('conversations as c', 'c.id', '=', 'm.conversation_id')->select('m.id')
            ->whereNotNull('m.receiver_id')->whereRaw(
                'NOT ((m.sender_id = c.user_id1 AND m.receiver_id = c.user_id2)'
                .' OR (m.sender_id = c.user_id2 AND m.receiver_id = c.user_id1)) OR m.sender_id = m.receiver_id'
            ), 'Message sender/receiver must be the two conversation participants.');
        $add('empty_messages', $this->db->table('messages as m')->select('m.id')
            ->whereRaw("(m.message IS NULL OR TRIM(m.message) = '')")->whereNotExists(function ($q) {
                $q->selectRaw('1')->from('file_attachments as f')->whereColumn('f.message_id', 'm.id');
            }), 'Message has neither text nor attachment metadata.');
        $add('empty_posts', $this->db->table('posts as p')->select('p.id')
            ->whereRaw("(p.content IS NULL OR TRIM(p.content) = '')")->whereNotExists(function ($q) {
                $q->selectRaw('1')->from('file_attachments as f')->whereColumn('f.post_id', 'p.id');
            }), 'Post has neither text nor attachment metadata.');
        $add('invalid_attachment_owner', $this->db->table('file_attachments')->select('id')->whereRaw(
            '(post_id IS NULL AND message_id IS NULL) OR (post_id IS NOT NULL AND message_id IS NOT NULL)'
        ), 'Attachment must belong to exactly one post or message; includes deletion orphans.');
        $add('invalid_attachment_metadata', $this->db->table('file_attachments')->select('id')
            ->where('size', '<', 0)->orWhereRaw("TRIM(path) = '' OR TRIM(mime) = '' OR TRIM(name) = ''"), 'Negative size or empty required file metadata. No file contents or paths are displayed.');
        foreach (['conversations' => 'conversation_id', 'groups' => 'group_id'] as $table => $target) {
            $add('invalid_'.$table.'_last_message', $this->db->table($table.' as p')
                ->leftJoin('messages as m', 'm.id', '=', 'p.last_message_id')->select('p.id')
                ->whereNotNull('p.last_message_id')->where(function ($q) use ($target) {
                    $q->whereNull('m.id')->orWhereNull('m.'.$target)->orWhereColumn('m.'.$target, '<>', 'p.id');
                }), 'Last-message pointer is missing or belongs to a different thread.');
        }
        $morph = (new User)->getMorphClass();
        $add('orphan_notifications', $this->db->table('notifications as n')->select('n.id')
            ->where('n.notifiable_type', $morph)->whereNotExists(function ($q) {
                $q->selectRaw('1')->from('users as u')->whereColumn('u.id', 'n.notifiable_id');
            }), 'Notification recipient does not exist. Historical payload targets are not foreign keys.');
        $add('unknown_notification_type', $this->db->table('notifications')->select('id')->where('notifiable_type', '<>', $morph), 'Unknown notifiable type needs domain review.', 'warning');

        // Count only: OAuth identifiers can be credentials, so never project them.
        foreach ([
            ['oauth_access_tokens', 'user_id', 'users'], ['oauth_access_tokens', 'client_id', 'oauth_clients'],
            ['oauth_auth_codes', 'user_id', 'users'], ['oauth_auth_codes', 'client_id', 'oauth_clients'],
            ['oauth_clients', 'user_id', 'users'], ['oauth_refresh_tokens', 'access_token_id', 'oauth_access_tokens'],
            ['oauth_personal_access_clients', 'client_id', 'oauth_clients'], ['sessions', 'user_id', 'users'],
        ] as [$table, $column, $parent]) {
            $add('orphan_'.$table.'_'.$column, $this->db->table($table.' as r')->selectRaw('1 as redacted')
                ->whereNotNull('r.'.$column)->whereNotExists(function ($q) use ($parent, $column) {
                    // Legacy ancillary user_id columns are BIGINT; avoid MySQL
                    // numeric coercion accidentally matching an unrelated UUID.
                    $q->selectRaw('1')->from($parent.' as p')->whereRaw('p.id = CAST(r.'.$column.' AS CHAR)');
                }), 'Ancillary reference lacks a parent; credential identifiers are redacted.');
        }

        return $checks;
    }
}
