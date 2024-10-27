<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Conversation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Conversation>
 */
class ConversationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Fetch valid user IDs
        $userIds = User::pluck('id')->toArray();

        // Ensure we pick two different users
        $userId1 = $this->faker->randomElement($userIds);
        do {
            $userId2 = $this->faker->randomElement($userIds);
        } while ($userId2 === $userId1);

        return [
            'user_id1' => min($userId1, $userId2),
            'user_id2' => max($userId1, $userId2),
        ];
    }
}
