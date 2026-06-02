<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Holiday;
use Illuminate\Database\Eloquent\Factories\Factory;

class HolidayFactory extends Factory
{
    protected $model = Holiday::class;

    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'name' => fake()->unique()->word(),
            'date' => fake()->unique()->date(),
            'type' => fake()->randomElement(['regular', 'special']),
        ];
    }
}
