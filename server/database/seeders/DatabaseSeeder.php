<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Group;
use App\Models\Message;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed users
        User::factory(10)->create(); // Create 10 users

        // Seed groups and attach users to each group with UUIDs
        Group::factory(5)->create()->each(function ($group) {
            $users = User::inRandomOrder()->take(rand(2, 5))->pluck('id');

            foreach ($users as $userId) {
                // Insert into the pivot table with a manually generated UUID for 'id'
                $group->users()->attach($userId, ['id' => (string) Str::uuid()]);
            }
        });

        // Seed messages
        Message::factory(50)->create(); // Create 50 messages
    }
}
