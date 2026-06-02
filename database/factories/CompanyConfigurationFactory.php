<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\CompanyConfiguration;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyConfigurationFactory extends Factory
{
    protected $model = CompanyConfiguration::class;

    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'key' => fake()->unique()->word(),
            'value' => (string) fake()->randomFloat(2, 1, 1000),
        ];
    }
}
