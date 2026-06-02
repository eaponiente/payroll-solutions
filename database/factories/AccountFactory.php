<?php

namespace Database\Factories;

use App\Models\Account;
use Illuminate\Database\Eloquent\Factories\Factory;

class AccountFactory extends Factory
{
    protected $model = Account::class;

    private static int $sequence = 0;

    public function definition(): array
    {
        self::$sequence++;

        return [
            'name' => 'Account '.self::$sequence,
            'slug' => 'account-'.self::$sequence,
            'is_active' => true,
        ];
    }
}
