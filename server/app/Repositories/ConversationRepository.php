<?php

namespace App\Repositories;

use App\Models\Conversation;
use App\Support\ConversationParticipants;
use App\Support\UniqueResource;

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
        [$low, $high] = ConversationParticipants::ordered($userId1, $userId2);

        return $this->conversation->where('participant_low', $low)->where('participant_high', $high)->first();
    }

    // Create a new conversation between two users
    public function createConversation($userId1, $userId2)
    {
        [$low, $high] = ConversationParticipants::ordered($userId1, $userId2);

        return UniqueResource::resolve(
            $this->conversation->where('participant_low', $low)->where('participant_high', $high),
            ['user_id1' => $low, 'user_id2' => $high],
            'conversations_participants_unique', ['conversations.participant_low', 'conversations.participant_high']
        );
    }

    public function updateLastMessageId($conversationId, $messageId)
    {
        return $this->conversation->where('id', $conversationId)
            ->update(['last_message_id' => $messageId]);
    }
}
