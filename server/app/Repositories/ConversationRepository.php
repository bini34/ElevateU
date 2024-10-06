<?php

namespace App\Repositories;

use App\Models\Conversation;

class ConversationRepository
{
    protected $conversation;

    public function __construct(Conversation $conversation)
    {
        $this->conversation = $conversation;
    }

    // Check if a conversation exists between two users
    public function findConversation($userId1, $userId2)
    {
        return $this->conversation
            ->where(function ($query) use ($userId1, $userId2) {
                $query->where('user_id1', $userId1)
                      ->where('user_id2', $userId2);
            })
            ->orWhere(function ($query) use ($userId1, $userId2) {
                $query->where('user_id1', $userId2)
                      ->where('user_id2', $userId1);
            })
            ->first();
    }

    // Create a new conversation between two users
    public function createConversation($userId1, $userId2)
    {
        return $this->conversation->create([
            'user_id1' => $userId1,
            'user_id2' => $userId2,
        ]);
    }

    public function updateLastMessageId($conversationId, $messageId)
    {
        return $this->conversation->where('id', $conversationId)
            ->update(['last_message_id' => $messageId]);
    }
}
