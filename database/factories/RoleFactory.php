<?php

namespace Database\Factories;

use App\Models\Account;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoleFactory extends Factory
{
    protected $model = Role::class;

    private static int $sequence = 0;

    public function definition(): array
    {
        self::$sequence++;

        return [
            'account_id' => Account::factory(),
            'name' => 'Role '.self::$sequence,
            'slug' => 'role-'.self::$sequence,
            'is_default' => false,
        ];
    }

    public function owner(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Owner',
            'slug' => 'owner',
            'is_default' => true,
        ]);
    }
}
