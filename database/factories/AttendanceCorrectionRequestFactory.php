<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\AttendanceCorrectionRequest;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

class AttendanceCorrectionRequestFactory extends Factory
{
    protected $model = AttendanceCorrectionRequest::class;

    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'employee_id' => Employee::factory(),
            'date' => fake()->date(),
            'correction_type' => 'missed_punch_in',
            'requested_in' => '08:00',
            'reason' => 'Forgot to punch in',
            'status' => 'pending',
        ];
    }
}
