<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Group;
use App\Models\Message;
use Illuminate\Database\Eloquent\Factories\Factory;

class MessageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'group_id' => null,
            'conversation_id' => Conversation::factory(),
            'sender_id' => fn (array $attributes) => Conversation::findOrFail($attributes['conversation_id'])->user_id1,
            'receiver_id' => fn (array $attributes) => Conversation::findOrFail($attributes['conversation_id'])->user_id2,
            'message' => 'Checking in after a focused practice session.',
        ];
    }

    public function inConversation(Conversation $conversation): static
    {
        return $this->state(fn () => [
            'conversation_id' => $conversation->id, 'group_id' => null,
            'sender_id' => $conversation->user_id1, 'receiver_id' => $conversation->user_id2,
        ]);
    }

    public function inGroup(?Group $group = null): static
    {
        return $this->state(fn () => [
            'group_id' => $group ?? Group::factory(),
            'conversation_id' => null, 'receiver_id' => null,
            'sender_id' => fn (array $attributes) => Group::findOrFail($attributes['group_id'])->owner_id,
        ]);
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Message $message): void {
            if ($message->group_id) {
                Group::whereKey($message->group_id)->update(['last_message_id' => $message->id]);
            } else {
                Conversation::whereKey($message->conversation_id)->update(['last_message_id' => $message->id]);
            }
        });
    }
}
