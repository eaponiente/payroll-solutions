<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Employee;
use App\Models\Fine;
use Illuminate\Database\Eloquent\Factories\Factory;

class FineFactory extends Factory
{
    protected $model = Fine::class;

    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'employee_id' => Employee::factory(),
            'date' => fake()->date(),
            'fine_type' => 'Late',
            'amount' => fake()->randomFloat(2, 10, 500),
            'reason' => fake()->sentence(),
            'marked_by' => Employee::factory(),
        ];
    }
}
