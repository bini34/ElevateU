<?php

namespace Database\Factories;

use App\Models\Goal;
use Illuminate\Database\Eloquent\Factories\Factory;

class GoalMilestoneFactory extends Factory
{
    public function definition(): array
    {
        // Reusing a parent for a collection requires explicit distinct positions.
        return ['goal_id' => Goal::factory()->milestoneGoal(), 'title' => 'Publish a first project', 'position' => 1, 'completed_at' => null];
    }

    public function completed(): static
    {
        return $this->state(fn () => ['completed_at' => now()]);
    }
}
