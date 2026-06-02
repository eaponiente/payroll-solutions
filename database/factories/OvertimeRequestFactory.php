<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Employee;
use App\Models\OvertimeRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

class OvertimeRequestFactory extends Factory
{
    protected $model = OvertimeRequest::class;

    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'employee_id' => Employee::factory(),
            'date' => fake()->date(),
            'requested_minutes' => fake()->numberBetween(30, 240),
            'reason' => fake()->sentence(),
            'shift_type' => 'regular_day',
            'status' => 'pending',
        ];
    }
}
