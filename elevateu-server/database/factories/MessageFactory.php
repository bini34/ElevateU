<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
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

        // Ensure we pick a valid sender
        $senderId = $this->faker->randomElement($userIds);

        // Ensure receiver is different from the sender
        do {
            $receiverId = $this->faker->randomElement($userIds);
        } while ($receiverId === $senderId);

        // Optionally assign the message to a group
        $groupId = null;
        if ($this->faker->boolean(50)) {
            $groupId = $this->faker->randomElement(Group::pluck('id')->toArray());

            // Fetch group users and ensure sender is from the group
            $group = Group::find($groupId);
            $senderId = $this->faker->randomElement($group->users->pluck('id')->toArray());
        }

        return [
            'sender_id' => $senderId,
            'receiver_id' => $receiverId,
            'group_id' => $groupId,
            'message' => $this->faker->realText(200),
            'created_at' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'updated_at' => now(),
        ];
    }
}
