<?php

namespace Database\Factories;

use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Group>
 */
class GroupFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->company,
            'description' => $this->faker->sentence,
            'owner_id' => User::factory()->withProfile(),
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Group $group): void {
            $group->users()->syncWithoutDetaching([$group->owner_id]);
        });
    }
}
