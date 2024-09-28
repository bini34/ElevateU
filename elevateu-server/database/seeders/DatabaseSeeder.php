<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Group;
use App\Models\Message;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed users
        User::factory(10)->create(); // Create 10 users

        // Seed groups
        Group::factory(5)->create()->each(function ($group) {
            // Attach users to each group
            $users = \App\Models\User::inRandomOrder()->take(rand(2, 5))->pluck('id');
            $group->users()->attach($users);
        });

        // Seed messages
        Message::factory(50)->create(); // Create 50 messages
    }
}
