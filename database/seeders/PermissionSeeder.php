<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            ['name' => 'View Employees', 'slug' => 'employees.view', 'group' => 'employees'],
            ['name' => 'Create Employees', 'slug' => 'employees.create', 'group' => 'employees'],
            ['name' => 'Edit Employees', 'slug' => 'employees.edit', 'group' => 'employees'],
            ['name' => 'Delete Employees', 'slug' => 'employees.delete', 'group' => 'employees'],
            ['name' => 'Rehire Employees', 'slug' => 'employees.rehire', 'group' => 'employees'],
            ['name' => 'View Payroll', 'slug' => 'payroll.view', 'group' => 'payroll'],
            ['name' => 'Generate Payroll', 'slug' => 'payroll.generate', 'group' => 'payroll'],
            ['name' => 'Approve Payroll', 'slug' => 'payroll.approve', 'group' => 'payroll'],
            ['name' => 'Void Payroll', 'slug' => 'payroll.void', 'group' => 'payroll'],
            ['name' => 'View Payslips', 'slug' => 'payslips.view', 'group' => 'payslips'],
            ['name' => 'Punch IN/OUT', 'slug' => 'attendance.punch', 'group' => 'attendance'],
            ['name' => 'View Own Attendance', 'slug' => 'attendance.view_own', 'group' => 'attendance'],
            ['name' => 'View Branch Attendance', 'slug' => 'attendance.view_branch', 'group' => 'attendance'],
            ['name' => 'Create Manual Logs', 'slug' => 'attendance.create_manual', 'group' => 'attendance'],
            ['name' => 'Submit Overtime', 'slug' => 'overtime.submit', 'group' => 'overtime'],
            ['name' => 'Approve Overtime', 'slug' => 'overtime.approve', 'group' => 'overtime'],
            ['name' => 'Submit Leave', 'slug' => 'leaves.submit', 'group' => 'leaves'],
            ['name' => 'Approve Leave', 'slug' => 'leaves.approve', 'group' => 'leaves'],
            ['name' => 'Submit Corrections', 'slug' => 'corrections.submit', 'group' => 'corrections'],
            ['name' => 'Approve Corrections', 'slug' => 'corrections.approve', 'group' => 'corrections'],
            ['name' => 'Submit Cash Advance', 'slug' => 'cash_advances.submit', 'group' => 'cash_advances'],
            ['name' => 'Approve Cash Advance', 'slug' => 'cash_advances.approve', 'group' => 'cash_advances'],
            ['name' => 'View Fines', 'slug' => 'fines.view', 'group' => 'fines'],
            ['name' => 'Create Fines', 'slug' => 'fines.create', 'group' => 'fines'],
            ['name' => 'Manage Holidays', 'slug' => 'admin.manage_holidays', 'group' => 'admin'],
            ['name' => 'Manage Roles', 'slug' => 'admin.manage_roles', 'group' => 'admin'],
            ['name' => 'Manage Shifts', 'slug' => 'admin.manage_shifts', 'group' => 'admin'],
            ['name' => 'Manage Config', 'slug' => 'admin.manage_config', 'group' => 'admin'],
            ['name' => 'Manage SSS', 'slug' => 'admin.manage_sss', 'group' => 'admin'],
            ['name' => 'Manage OT Rates', 'slug' => 'admin.manage_ot_rates', 'group' => 'admin'],
            ['name' => 'Adjust Attendance', 'slug' => 'attendance.adjust', 'group' => 'attendance'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['slug' => $permission['slug']], $permission);
        }
    }
}
