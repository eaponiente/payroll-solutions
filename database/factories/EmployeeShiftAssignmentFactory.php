<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use App\Models\Shift;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeShiftAssignmentFactory extends Factory
{
    protected $model = EmployeeShiftAssignment::class;

    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'employee_id' => Employee::factory(),
            'shift_id' => Shift::factory(),
            'date' => fake()->date(),
        ];
    }
}
