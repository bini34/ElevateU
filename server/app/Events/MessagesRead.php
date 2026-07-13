<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Emitted when a participant marks a conversation as read, so the other
 * side can flip its sent messages to "Read" in real time.
 */
class MessagesRead implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $conversationId;
    public $readerId;
    public $readAt;

    public function __construct(string $conversationId, string $readerId, string $readAt)
    {
        $this->conversationId = $conversationId;
        $this->readerId = $readerId;
        $this->readAt = $readAt;
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('conversations.' . $this->conversationId)];
    }

    public function broadcastAs(): string
    {
        return 'messages.read';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'reader_id' => $this->readerId,
            'read_at' => $this->readAt,
        ];
    }
}
