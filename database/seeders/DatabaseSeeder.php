<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AccountSeeder::class,
            RoleSeeder::class,
            DeMinimisSeeder::class,
            EmployeeSeeder::class,
            // DemoDataSeeder::class,
            // DemoShiftSeeder::class,
        ]);
    }
}
