<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeScheduleFactory extends Factory
{
    protected $model = EmployeeSchedule::class;

    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'employee_id' => Employee::factory(),
            'schedule_start' => '08:00',
            'schedule_end' => '17:00',
            'rest_days' => json_encode(['Sunday']),
            'effective_from' => fake()->date(),
            'effective_to' => null,
        ];
    }
}
