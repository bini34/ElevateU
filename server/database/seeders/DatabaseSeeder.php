<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Production initialization has no demo side effects.
        $this->command?->info('No default seed data. Use the explicitly enabled DemoSeeder in an isolated demo database.');
    }
}
