<?php

namespace App\Console\Commands;

use App\Models\Account;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\HolidaySeeder;
use Database\Seeders\PermissionSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PayrollSetupCommand extends Command
{
    protected $signature = 'payroll:setup {--name=} {--email=} {--password=}';

    protected $description = 'Set up a new payroll account with owner role and superadmin user';

    public function handle(): int
    {
        $this->call(PermissionSeeder::class);
        $this->call(HolidaySeeder::class);

        $name = $this->option('name') ?: $this->ask('Account name');

        $account = Account::create([
            'name' => $name,
            'slug' => Str::slug($name),
        ]);

        $email = $this->option('email') ?: $this->ask('Superadmin email');
        $password = $this->option('password') ?: $this->secret('Superadmin password');

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

        $employee = Employee::create([
            'account_id' => $account->id,
            'role_id' => $ownerRole->id,
            'employee_number' => 'OWNER-1',
            'username' => Str::before($email, '@'),
            'location' => 'Main',
            'first_name' => 'Owner',
            'last_name' => $name,
            'hire_date' => now(),
            'current_daily_rate' => 0.00,
        ]);

        $user = User::create([
            'name' => Str::before($email, '@'),
            'email' => $email,
            'password' => Hash::make($password),
            'employee_id' => $employee->id,
        ]);

        $account->users()->attach($user->id, ['is_owner' => true]);

        $this->info("Account '{$name}' created successfully.");
        $this->info("Superadmin: {$email}");

        return self::SUCCESS;
    }
}
