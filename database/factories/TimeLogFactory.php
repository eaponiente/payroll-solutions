<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Employee;
use App\Models\TimeLog;
use Illuminate\Database\Eloquent\Factories\Factory;

class TimeLogFactory extends Factory
{
    protected $model = TimeLog::class;

    public function definition(): array
    {
        return [
            'account_id' => Account::factory(),
            'employee_id' => Employee::factory(),
            'type' => 'in',
            'source' => 'correction',
            'punched_at' => now(),
        ];
    }
}
