<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Message;
use App\Models\Group;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory(10)->create();

        Group::factory(5)->create()->each(function ($group) {
            $group->users()->attach(User::inRandomOrder()->take(3)->pluck('id'));
        });

        Message::factory(50)->create();
    }
}
