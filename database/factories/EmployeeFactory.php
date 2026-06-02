<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Employee;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

class EmployeeFactory extends Factory
{
    protected $model = Employee::class;

    private static int $sequence = 0;

    public function definition(): array
    {
        self::$sequence++;

        return [
            'account_id' => Account::factory(),
            'role_id' => Role::factory(),
            'employee_number' => sprintf('EMP-%s-%04d', now()->year, self::$sequence),
            'username' => sprintf('EMP-%s-%04d', now()->year, self::$sequence),
            'first_name' => fake()->firstName(),
            'location' => fake()->optional()->city(),
            'last_name' => fake()->lastName(),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'hire_date' => fake()->date(),
            'position' => 'regular',
            'status' => 'active',
            'current_daily_rate' => fake()->randomFloat(2, 500, 1500),
            'leaves_used_this_year' => 0,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
            'end_date' => now()->subMonth(),
        ]);
    }

    public function withRole(Role $role): static
    {
        return $this->state(fn (array $attributes) => [
            'role_id' => $role->id,
            'account_id' => $role->account_id,
        ]);
    }
}
