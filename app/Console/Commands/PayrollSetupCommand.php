<?php

namespace App\Console\Commands;

use App\Models\Account;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\HolidaySeeder;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\ShiftSeeder;
use Database\Seeders\SssBracketSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PayrollSetupCommand extends Command
{
    protected $signature = 'payroll:setup {--name=} {--email=} {--password=}';

    protected $description = 'Set up a new payroll account with owner role and superadmin user';

    public function handle(): int
    {
        $name = $this->option('name') ?: $this->ask('Account name');
        $email = $this->option('email') ?: $this->ask('Superadmin email');
        $password = $this->option('password') ?: $this->secret('Superadmin password');

        $account = Account::create([
            'name' => $name,
            'slug' => Str::slug($name),
        ]);

        $this->call(PermissionSeeder::class);
        $this->call(HolidaySeeder::class);
        $this->call(SssBracketSeeder::class);
        $this->call(ShiftSeeder::class);
        $this->call(RoleSeeder::class);

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

        $staffRole = Role::where('account_id', $account->id)->where('slug', 'staff')->firstOrFail();

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

        $this->info("Account '{$name}' created successfully.");
        $this->info("Superadmin: {$email}");

        return self::SUCCESS;
    }
}
