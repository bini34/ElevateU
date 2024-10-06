<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Group;
use App\Models\Conversation;
use App\Models\Message;
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

        // Define whether this is a group message or P2P message
        $isGroupMessage = $this->faker->boolean(50); // 50% chance it's a group message

        if ($isGroupMessage) {
            // Group message logic
            $groupId = $this->faker->randomElement(Group::pluck('id')->toArray());

            // Get a valid sender from the group
            $group = Group::find($groupId);
            if ($group && $group->users()->exists()) {
                $senderId = $this->faker->randomElement($group->users->pluck('id')->toArray());
            }

            return [
                'sender_id' => $senderId,
                'receiver_id' => null,  // No receiver for group messages
                'group_id' => $groupId,
                'conversation_id' => null,  // No conversation for group messages
                'message' => $this->faker->realText(200),
                'created_at' => $this->faker->dateTimeBetween('-1 year', 'now'),
                'updated_at' => now(),
            ];
        } else {
            // P2P message logic
            do {
                $receiverId = $this->faker->randomElement($userIds);
            } while ($receiverId === $senderId);  // Ensure receiver is not the sender

            // We are not creating or looking up the conversation here
            return [
                'sender_id' => $senderId,
                'receiver_id' => $receiverId,  // P2P message has a receiver
                'group_id' => null,  // No group ID for P2P messages
                'conversation_id' => null,  // We’ll handle the conversation assignment elsewhere
                'message' => $this->faker->realText(200),
                'created_at' => $this->faker->dateTimeBetween('-1 year', 'now'),
                'updated_at' => now(),
            ];
        }
    }
}
