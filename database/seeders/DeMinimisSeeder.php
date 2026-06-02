<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\DeMinimisBenefit;
use Illuminate\Database\Seeder;

class DeMinimisSeeder extends Seeder
{
    public function run(): void
    {
        $account = Account::first();

        if (! $account || DeMinimisBenefit::count() > 0) {
            return;
        }

        $benefits = [
            ['name' => 'Rice Subsidy', 'default_amount' => 2000, 'frequency' => 'monthly'],
            ['name' => 'Clothing Allowance', 'default_amount' => 6000, 'frequency' => 'annual'],
            ['name' => 'Medical Assistance', 'default_amount' => 1500, 'frequency' => 'monthly'],
            ['name' => 'Laundry Allowance', 'default_amount' => 300, 'frequency' => 'monthly'],
            ['name' => 'Transportation Allowance', 'default_amount' => 1000, 'frequency' => 'monthly'],
        ];

        foreach ($benefits as $benefit) {
            DeMinimisBenefit::create([
                'account_id' => $account->id,
                ...$benefit,
            ]);
        }

        $this->command?->info('De minimis benefits seeded.');
    }
}
