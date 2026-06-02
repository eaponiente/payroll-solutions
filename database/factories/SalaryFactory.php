<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Employee;
use App\Models\Salary;
use Illuminate\Database\Eloquent\Factories\Factory;

class SalaryFactory extends Factory
{
    protected $model = Salary::class;

    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'employee_id' => Employee::factory(),
            'daily_rate' => fake()->randomFloat(2, 500, 2000),
            'effective_date' => fake()->date(),
            'end_date' => null,
        ];
    }
}
