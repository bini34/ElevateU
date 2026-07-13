<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast synchronously (ShouldBroadcastNow) so chat delivery does not
 * depend on a queue worker being alive; the Reverb POST is local and fast.
 */
class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message->loadMissing([
            'sender' => function ($query) {
                $query->select('id', 'user_name')
                      ->with(['profile' => function ($query) {
                          $query->select('user_id', 'profile_picture_URL', 'first_name', 'last_name');
                      }]);
            },
            'fileAttachments',
        ]);
    }

    public function broadcastOn(): array
    {
        if ($this->message->group_id) {
            return [new PrivateChannel('groups.' . $this->message->group_id)];
        }

        return [new PrivateChannel('conversations.' . $this->message->conversation_id)];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return ['message' => $this->message->toArray()];
    }
}
