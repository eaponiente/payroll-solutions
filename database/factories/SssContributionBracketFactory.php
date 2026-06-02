<?php

namespace Database\Factories;

use App\Models\SssContributionBracket;
use Illuminate\Database\Eloquent\Factories\Factory;

class SssContributionBracketFactory extends Factory
{
    protected $model = SssContributionBracket::class;

    public function definition(): array
    {
        return [
            'salary_min' => fake()->randomFloat(2, 0, 100000),
            'salary_max' => fake()->optional()->randomFloat(2, 10001, 200000),
            'employee_percentage' => fake()->randomFloat(2, 1, 15),
            'employer_percentage' => fake()->randomFloat(2, 1, 20),
            'effective_from' => '2025-01-01',
        ];
    }
}
