<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\AttendanceSheet;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

class AttendanceSheetFactory extends Factory
{
    protected $model = AttendanceSheet::class;

    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'employee_id' => Employee::factory(),
            'date' => fake()->date(),
            'schedule_start' => '08:00',
            'schedule_end' => '17:00',
            'is_present' => 1,
        ];
    }
}
