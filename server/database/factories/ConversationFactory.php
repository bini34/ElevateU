<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ConversationFactory extends Factory
{
    public function definition(): array
    {
        // Independent of existing rows; never loops on a zero/one-user database.
        return [
            'user_id1' => User::factory()->withProfile(),
            'user_id2' => User::factory()->withProfile(),
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (Conversation $conversation): void {
            $participants = [$conversation->user_id1, $conversation->user_id2];
            if ($participants[0] === $participants[1]) {
                throw new \InvalidArgumentException('A conversation requires distinct participants.');
            }
            sort($participants, SORT_STRING);
            [$conversation->user_id1, $conversation->user_id2] = $participants;
        });
    }
}
