<?php

namespace Database\Factories;

use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class GroupUserFactory extends Factory
{
    public function definition(): array
    {
        return ['group_id' => Group::factory(), 'user_id' => User::factory()->withProfile()];
    }
}
