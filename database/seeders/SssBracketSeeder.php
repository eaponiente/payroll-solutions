<?php

namespace Database\Seeders;

use App\Models\SssContributionBracket;
use Illuminate\Database\Seeder;

class SssBracketSeeder extends Seeder
{
    public function run(): void
    {
        if (SssContributionBracket::count() > 0) {
            return;
        }

        $msc = 1000;
        $brackets = [];

        while ($msc <= 30000) {
            $salaryMin = $msc - 500 > 0
                ? round((($msc - 500) + 0.01), 2)
                : 0;
            $salaryMax = round($msc + 250, 2);

            $brackets[] = [
                'salary_min' => $salaryMin,
                'salary_max' => $salaryMax,
            ];

            $msc += 500;
        }

        $lastIndex = count($brackets) - 1;
        $brackets[$lastIndex]['salary_max'] = null;

        foreach ($brackets as $bracket) {
            SssContributionBracket::create([
                ...$bracket,
                'employee_percentage' => 5.00,
                'employer_percentage' => 10.00,
                'effective_from' => '2026-01-01',
            ]);
        }
    }
}
