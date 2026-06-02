<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Shift;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShiftFactory extends Factory
{
    protected $model = Shift::class;

    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'name' => fake()->word(),
            'start_time' => fake()->time('H:i'),
            'end_time' => fake()->time('H:i'),
            'night_differential' => false,
            'rest_days' => ['sunday'],
            'sort_order' => 0,
        ];
    }
}
