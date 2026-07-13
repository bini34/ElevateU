<?php

namespace App\Repositories;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;

class MessageRepository
{
    protected $message;
    protected $user;

    public function __construct(Message $message, User $user)
    {
        $this->message = $message;
        $this->user = $user;
    }

    protected function withSender($query)
    {
        return $query->with([
            'sender' => function ($query) {
                $query->select('id', 'user_name')
                      ->with(['profile' => function ($query) {
                          $query->select('user_id', 'profile_picture_URL', 'first_name', 'last_name');
                      }]);
            },
            'fileAttachments',
        ]);
    }

    public function create(array $data)
    {
        return $this->message->create($data);
    }

    public function find($id)
    {
        return $this->withSender($this->message->newQuery())->findOrFail($id);
    }

    public function findBySenderAndClientUuid(string $senderId, string $clientUuid)
    {
        return $this->withSender($this->message->newQuery())
            ->where('sender_id', $senderId)
            ->where('client_uuid', $clientUuid)
            ->first();
    }

    /**
     * Newest page first; the client reverses each page for display and asks
     * for higher pages to load older history.
     */
    public function getMessagesByConversationPaginated($conversationId, $perPage = 20)
    {
        return $this->withSender($this->message->newQuery())
            ->where('conversation_id', $conversationId)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function getMessagesByGroupPaginated($groupId, $perPage = 20)
    {
        return $this->withSender($this->message->newQuery())
            ->where('group_id', $groupId)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    /**
     * Mark every message the other participant sent in this conversation as
     * read. Returns the number of rows updated.
     */
    public function markConversationRead(string $conversationId, string $readerId, string $readAt): int
    {
        return $this->message->where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $readerId)
            ->whereNull('read_at')
            ->update(['read_at' => $readAt]);
    }

    /**
     * Chat list cards: existing conversations (with last message + unread
     * count) followed by other users you can start a chat with.
     *
     * Three bounded queries — never loads full message history.
     */
    public function getUserConversations(string $userId)
    {
        $conversations = Conversation::where('user_id1', $userId)
            ->orWhere('user_id2', $userId)
            ->with([
                'lastMessage',
                'user1' => fn ($q) => $q->select('id', 'user_name')->with('profile'),
                'user2' => fn ($q) => $q->select('id', 'user_name')->with('profile'),
            ])
            ->get();

        $unreadCounts = $this->message->selectRaw('conversation_id, COUNT(*) as unread')
            ->whereIn('conversation_id', $conversations->pluck('id'))
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->groupBy('conversation_id')
            ->pluck('unread', 'conversation_id');

        $conversationCards = $conversations->map(function ($conversation) use ($userId, $unreadCounts) {
            $other = $conversation->user_id1 === $userId ? $conversation->user2 : $conversation->user1;
            if (!$other) {
                return null; // participant deleted
            }

            return [
                'user_id' => $other->id,
                'user_name' => $other->user_name,
                'first_name' => $other->profile->first_name ?? '',
                'last_name' => $other->profile->last_name ?? '',
                'profile_picture_URL' => $other->profile->profile_picture_URL ?? null,
                'has_conversation' => true,
                'conversation_id' => $conversation->id,
                'last_message' => $conversation->lastMessage?->message,
                'last_message_at' => $conversation->lastMessage?->created_at,
                'last_message_sender_id' => $conversation->lastMessage?->sender_id,
                'unread_count' => (int) ($unreadCounts[$conversation->id] ?? 0),
            ];
        })->filter()->sortByDesc('last_message_at')->values();

        $knownIds = $conversationCards->pluck('user_id')->push($userId);

        $otherUsers = $this->user->whereNotIn('id', $knownIds)
            ->with('profile')
            ->orderBy('created_at')
            ->limit(100)
            ->get()
            ->map(fn ($user) => [
                'user_id' => $user->id,
                'user_name' => $user->user_name,
                'first_name' => $user->profile->first_name ?? '',
                'last_name' => $user->profile->last_name ?? '',
                'profile_picture_URL' => $user->profile->profile_picture_URL ?? null,
                'has_conversation' => false,
                'conversation_id' => null,
                'last_message' => null,
                'last_message_at' => null,
                'last_message_sender_id' => null,
                'unread_count' => 0,
            ]);

        return $conversationCards->concat($otherUsers)->values();
    }
}
