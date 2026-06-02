<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\PayrollPeriodItem;
use Illuminate\Database\Eloquent\Factories\Factory;

class PayrollPeriodItemFactory extends Factory
{
    protected $model = PayrollPeriodItem::class;

    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'payroll_period_id' => PayrollPeriod::factory(),
            'employee_id' => Employee::factory(),
            'daily_rate' => fake()->randomFloat(2, 500, 1500),
            'total_regular_days' => fake()->numberBetween(0, 26),
            'absent_days' => fake()->numberBetween(0, 5),
            'holiday_days' => fake()->numberBetween(0, 3),
            'late_minutes' => fake()->numberBetween(0, 120),
            'undertime_minutes' => fake()->randomFloat(2, 0, 60),
            'overtime_minutes' => fake()->numberBetween(0, 240),
            'gross_pay' => fake()->randomFloat(2, 5000, 50000),
            'late_deduction' => fake()->randomFloat(2, 0, 500),
            'undertime_deduction' => fake()->randomFloat(2, 0, 500),
            'overtime_pay' => fake()->randomFloat(2, 0, 5000),
            'holiday_pay' => fake()->randomFloat(2, 0, 3000),
            'fine_deduction' => fake()->randomFloat(2, 0, 1000),
            'sss_deduction' => fake()->randomFloat(2, 0, 1500),
            'philhealth_deduction' => fake()->randomFloat(2, 0, 800),
            'pagibig_deduction' => fake()->randomFloat(2, 0, 200),
            'cash_advance_deduction' => fake()->randomFloat(2, 0, 5000),
            'net_pay' => fake()->randomFloat(2, 5000, 40000),
        ];
    }
}
