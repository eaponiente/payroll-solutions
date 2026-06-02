<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $account = Account::first();

        if (! $account) {
            return;
        }

        if (Role::where('account_id', $account->id)->where('slug', 'admin')->doesntExist()) {
            $adminRole = Role::create([
                'account_id' => $account->id,
                'name' => 'Admin',
                'slug' => 'admin',
            ]);

            $adminPerms = Permission::whereIn('slug', [
                'employees.view', 'employees.create', 'employees.edit',
                'payroll.view', 'payroll.generate',
                'attendance.view_branch', 'attendance.create_manual',
                'overtime.approve',
                'leaves.approve',
                'corrections.approve',
                'cash_advances.approve',
                'fines.view', 'fines.create',
                'payslips.view',
                'admin.manage_holidays', 'admin.manage_roles',
                'admin.manage_config', 'admin.manage_sss', 'admin.manage_shifts',
            ])->get();

            $pivot = [];
            foreach ($adminPerms as $p) {
                $pivot[$p->id] = ['scope' => 'account'];
            }
            $adminRole->permissions()->attach($pivot);
        }

        if (Role::where('account_id', $account->id)->where('slug', 'staff')->doesntExist()) {
            $staffRole = Role::create([
                'account_id' => $account->id,
                'name' => 'Staff',
                'slug' => 'staff',
            ]);

            $staffPerms = Permission::whereIn('slug', [
                'attendance.punch', 'attendance.view_own',
                'overtime.submit',
                'leaves.submit',
                'corrections.submit',
                'cash_advances.submit',
                'payslips.view',
            ])->get();

            $pivot = [];
            foreach ($staffPerms as $p) {
                $pivot[$p->id] = ['scope' => 'self'];
            }
            $staffRole->permissions()->attach($pivot);
        }

        $this->command?->info('Roles seeded: Admin, Staff.');
    }
}
