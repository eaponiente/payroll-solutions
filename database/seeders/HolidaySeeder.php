<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Holiday;
use Illuminate\Database\Seeder;

class HolidaySeeder extends Seeder
{
    public function run(): void
    {
        $account = Account::first();
        $accountId = $account->id;

        $holidays = [
            // Regular Holidays
            ['name' => 'New Year\'s Day',          'date' => '2026-01-01', 'type' => 'regular'],
            ['name' => 'Maundy Thursday',           'date' => '2026-04-02', 'type' => 'regular'],
            ['name' => 'Good Friday',               'date' => '2026-04-03', 'type' => 'regular'],
            ['name' => 'Araw ng Kagitingan',        'date' => '2026-04-09', 'type' => 'regular'],
            ['name' => 'Labor Day',                 'date' => '2026-05-01', 'type' => 'regular'],
            ['name' => 'Eid\'l Fitr',              'date' => '2026-05-18', 'type' => 'regular'],
            ['name' => 'Independence Day',          'date' => '2026-06-12', 'type' => 'regular'],
            ['name' => 'Eid\'l Adha',              'date' => '2026-07-25', 'type' => 'regular'],
            ['name' => 'National Heroes Day',       'date' => '2026-08-31', 'type' => 'regular'],
            ['name' => 'Bonifacio Day',             'date' => '2026-11-30', 'type' => 'regular'],
            ['name' => 'Christmas Day',             'date' => '2026-12-25', 'type' => 'regular'],
            ['name' => 'Rizal Day',                 'date' => '2026-12-30', 'type' => 'regular'],

            // Special Non-Working Holidays
            ['name' => 'Chinese New Year',          'date' => '2026-02-17', 'type' => 'special'],
            ['name' => 'EDSA People Power',         'date' => '2026-02-25', 'type' => 'special'],
            ['name' => 'Black Saturday',            'date' => '2026-04-04', 'type' => 'special'],
            ['name' => 'Ninoy Aquino Day',          'date' => '2026-08-21', 'type' => 'special'],
            ['name' => 'All Saints\' Day',          'date' => '2026-11-01', 'type' => 'special'],
            ['name' => 'Feast of the Immaculate Conception', 'date' => '2026-12-08', 'type' => 'special'],
            ['name' => 'Christmas Eve',             'date' => '2026-12-24', 'type' => 'special'],
            ['name' => 'New Year\'s Eve',           'date' => '2026-12-31', 'type' => 'special'],
        ];

        foreach ($holidays as $holiday) {
            Holiday::firstOrCreate(
                ['account_id' => $accountId, 'date' => $holiday['date']],
                ['account_id' => $accountId, ...$holiday],
            );
        }
    }
}
