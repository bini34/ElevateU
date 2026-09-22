<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class GoalFactory extends Factory
{
    public function definition(): array
    {
        return ['user_id' => User::factory()->withProfile(), 'title' => 'Build my portfolio', 'description' => null,
            'visibility' => 'private', 'status' => 'active', 'measurement_type' => 'boolean', 'target_value' => null,
            'unit' => null, 'target_date' => '2026-12-31', 'completed_at' => null, 'archived_at' => null];
    }

    public function active(): static { return $this->state(['status' => 'active', 'completed_at' => null, 'archived_at' => null]); }
    public function completed(): static { return $this->state(fn () => ['status' => 'completed', 'completed_at' => now(), 'archived_at' => null]); }
    public function archived(): static { return $this->state(fn () => ['status' => 'archived', 'archived_at' => now()]); }
    public function public(): static { return $this->state(['visibility' => 'public']); }
    public function private(): static { return $this->state(['visibility' => 'private']); }
    public function countGoal(): static { return $this->state(['measurement_type' => 'count', 'target_value' => '12.000', 'unit' => 'books']); }
    public function durationGoal(): static { return $this->state(['measurement_type' => 'duration', 'target_value' => '600.000', 'unit' => 'minutes']); }
    public function milestoneGoal(): static { return $this->state(['measurement_type' => 'milestone', 'target_value' => null, 'unit' => null]); }
}
