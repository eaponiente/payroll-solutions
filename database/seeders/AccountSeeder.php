<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AccountSeeder extends Seeder
{
    public function run(): void
    {
        $account = Account::create([
            'name' => 'Default',
            'slug' => 'default',
        ]);

        $this->call([
            PermissionSeeder::class,
            HolidaySeeder::class,
            SssBracketSeeder::class,
            ShiftSeeder::class,
        ]);

        $ownerRole = Role::create([
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
        $ownerRole->permissions()->attach($pivotData);

        $staffRole = Role::create([
            'account_id' => $account->id,
            'name' => 'Staff',
            'slug' => 'staff',
        ]);

        $staffPerms = Permission::whereIn('slug', [
            'attendance.punch',
            'attendance.view_own',
            'overtime.submit',
            'leaves.submit',
            'corrections.submit',
            'cash_advances.submit',
        ])->get();

        $staffPivot = [];
        foreach ($staffPerms as $perm) {
            $staffPivot[$perm->id] = ['scope' => 'self'];
        }
        $staffRole->permissions()->attach($staffPivot);

        $email = 'admin@example.com';
        $password = 'password';

        $employee = Employee::create([
            'account_id' => $account->id,
            'role_id' => $ownerRole->id,
            'employee_number' => 'OWNER-1',
            'username' => Str::before($email, '@'),
            'location' => 'Main',
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'hire_date' => now(),
            'current_daily_rate' => 0.00,
        ]);

        $user = User::create([
            'name' => Str::before($email, '@'),
            'email' => $email,
            'password' => Hash::make($password),
            'employee_id' => $employee->id,
            'is_super_admin' => 1,
        ]);

        $account->users()->attach($user->id, ['is_owner' => true]);

        $noRoleEmployee = Employee::create([
            'account_id' => $account->id,
            'role_id' => null,
            'employee_number' => 'EMP-0001',
            'username' => 'norole',
            'location' => 'Main',
            'first_name' => 'No',
            'last_name' => 'Role',
            'position' => 'regular',
            'hire_date' => now(),
            'current_daily_rate' => 500.00,
        ]);

        User::create([
            'name' => 'norole',
            'email' => 'norole@example.com',
            'password' => Hash::make('password'),
            'employee_id' => $noRoleEmployee->id,
        ]);

        $staffEmployee = Employee::create([
            'account_id' => $account->id,
            'role_id' => $staffRole->id,
            'employee_number' => 'EMP-0002',
            'username' => 'staff',
            'location' => 'Main',
            'first_name' => 'Staff',
            'last_name' => 'User',
            'position' => 'regular',
            'hire_date' => now(),
            'current_daily_rate' => 500.00,
        ]);

        User::create([
            'name' => 'staff',
            'email' => 'staff@example.com',
            'password' => Hash::make('password'),
            'employee_id' => $staffEmployee->id,
        ]);
    }
}
