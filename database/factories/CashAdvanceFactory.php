<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\CashAdvance;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

class CashAdvanceFactory extends Factory
{
    protected $model = CashAdvance::class;

    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'employee_id' => Employee::factory(),
            'amount' => fake()->randomFloat(2, 100, 10000),
            'remaining_balance' => fake()->randomFloat(2, 0, 10000),
            'reason' => fake()->sentence(),
            'status' => 'pending',
        ];
    }
}
