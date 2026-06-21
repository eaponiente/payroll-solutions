<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Models\Account;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'password' => $this->passwordRules(),
        ])->validate();

        return DB::transaction(function () use ($input) {
            $name = trim($input['first_name'].' '.$input['last_name']);

            $user = User::create([
                'name' => $name,
                'email' => $input['email'],
                'password' => $input['password'],
            ]);

            $user->is_super_admin = true;
            $user->save();

            $account = Account::create([
                'name' => $name,
                'slug' => Str::slug($name).'-'.Str::random(6),
            ]);

            $role = Role::create([
                'account_id' => $account->id,
                'name' => 'Owner',
                'slug' => 'owner',
                'is_default' => true,
            ]);

            $permissions = Permission::all();
            $pivotData = [];
            foreach ($permissions as $permission) {
                $pivotData[$permission->id] = ['scope' => 'account'];
            }
            $role->permissions()->attach($pivotData);

            $employee = Employee::create([
                'account_id' => $account->id,
                'role_id' => $role->id,
                'employee_number' => 'EMP-'.now()->year.'-'.str_pad(random_int(1, 9999), 4, '0', STR_PAD_LEFT),
                'username' => Str::before($input['email'], '@'),
                'first_name' => $input['first_name'],
                'last_name' => $input['last_name'],
                'hire_date' => now(),
                'current_daily_rate' => 0.00,
            ]);

            $user->update(['employee_id' => $employee->id]);

            $account->users()->attach($user->id, ['is_owner' => true]);

            return $user;
        });
    }
}
