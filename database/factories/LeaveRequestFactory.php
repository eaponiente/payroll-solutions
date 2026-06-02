<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Employee;
use App\Models\LeaveRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

class LeaveRequestFactory extends Factory
{
    protected $model = LeaveRequest::class;

    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'employee_id' => Employee::factory(),
            'date' => fake()->date(),
            'leave_type' => 'vacation',
            'duration' => 'full_day',
            'is_paid' => true,
            'reason' => fake()->sentence(),
            'status' => 'pending',
        ];
    }
}
