<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Shift;
use Illuminate\Database\Seeder;

class ShiftSeeder extends Seeder
{
    public function run(): void
    {
        if (Shift::count() > 0) {
            return;
        }

        $account = Account::first();

        if (! $account) {
            return;
        }

        $shifts = [
            [
                'name' => 'Morning',
                'start_time' => '06:00',
                'end_time' => '14:00',
                'night_differential' => false,
                'rest_days' => ['sun'],
                'sort_order' => 0,
            ],
            [
                'name' => 'Afternoon',
                'start_time' => '14:00',
                'end_time' => '22:00',
                'night_differential' => false,
                'rest_days' => ['sun'],
                'sort_order' => 1,
            ],
            [
                'name' => 'Graveyard',
                'start_time' => '22:00',
                'end_time' => '06:00',
                'night_differential' => true,
                'rest_days' => ['sat', 'sun'],
                'sort_order' => 2,
            ],
        ];

        foreach ($shifts as $shift) {
            Shift::create([
                'account_id' => $account->id,
                ...$shift,
            ]);
        }
    }
}
