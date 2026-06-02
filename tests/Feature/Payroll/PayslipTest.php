<?php

use App\Models\Account;
use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\PayrollPeriodItem;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function actingAsPayslipStaff(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    $perm = Permission::firstOrCreate(['slug' => 'payslips.view'], [
        'name' => 'payslips.view',
        'group' => 'payslips',
    ]);
    $role->permissions()->attach($perm->id, ['scope' => 'self']);

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

function actingAsPayslipAdmin(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    $perm = Permission::firstOrCreate(['slug' => 'payslips.view'], [
        'name' => 'payslips.view',
        'group' => 'payslips',
    ]);
    $role->permissions()->attach($perm->id, ['scope' => 'account']);

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

test('guest cannot view payslips', function () {
    $employee = Employee::factory()->create();

    $this->get(route('payroll.payslips.show', $employee))
        ->assertRedirect(route('login'));
});

test('staff can view own payslip', function () {
    $data = actingAsPayslipStaff();

    $period = PayrollPeriod::factory()->create([
        'account_id' => $data['account']->id,
        'period_start' => now()->startOfMonth(),
        'period_end' => now()->endOfMonth(),
        'status' => 'approved',
    ]);
    PayrollPeriodItem::factory()->for($period)->for($data['employee'])->create([
        'account_id' => $data['account']->id,
    ]);

    $this->get(route('payroll.payslips.show', $data['employee']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('payroll/payslips/show')
            ->has('employee')
            ->has('items'),
        );
});

test('staff cannot view other employee payslip', function () {
    $data = actingAsPayslipStaff();

    $otherStaff = Employee::factory()->for($data['account'])->create();
    $period = PayrollPeriod::factory()->create([
        'account_id' => $data['account']->id,
        'period_start' => now()->startOfMonth(),
        'period_end' => now()->endOfMonth(),
        'status' => 'approved',
    ]);
    PayrollPeriodItem::factory()->for($period)->for($otherStaff)->create([
        'account_id' => $data['account']->id,
    ]);

    $this->get(route('payroll.payslips.show', $otherStaff))
        ->assertStatus(403);
});

test('admin can view any employee payslip in same account', function () {
    $data = actingAsPayslipAdmin();

    $staff = Employee::factory()->for($data['account'])->create();

    $period = PayrollPeriod::factory()->create([
        'account_id' => $data['account']->id,
        'period_start' => now()->startOfMonth(),
        'period_end' => now()->endOfMonth(),
        'status' => 'approved',
    ]);
    PayrollPeriodItem::factory()->for($period)->for($staff)->create([
        'account_id' => $data['account']->id,
    ]);

    $this->get(route('payroll.payslips.show', $staff))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('payroll/payslips/show')
            ->has('employee')
            ->has('items.data', 1),
        );
});

test('admin can view any employee payslip including different location', function () {
    $data = actingAsPayslipAdmin();

    $otherStaff = Employee::factory()->for($data['account'])->create();

    $this->get(route('payroll.payslips.show', $otherStaff))
        ->assertOk();
});

test('payslip shows payroll period relationship', function () {
    $data = actingAsPayslipStaff();

    $period = PayrollPeriod::factory()->create([
        'account_id' => $data['account']->id,
        'period_start' => '2025-03-01',
        'period_end' => '2025-03-15',
        'status' => 'approved',
    ]);
    PayrollPeriodItem::factory()->for($period)->for($data['employee'])->create([
        'account_id' => $data['account']->id,
        'gross_pay' => 15000.00,
        'net_pay' => 13500.00,
    ]);

    $this->get(route('payroll.payslips.show', $data['employee']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('payroll/payslips/show')
            ->has('items.data.0.payroll_period'),
        );
});

test('payslip paginates results', function () {
    config(['company.pagination_per_page' => 5]);

    $data = actingAsPayslipStaff();

    $period = PayrollPeriod::factory()->create([
        'account_id' => $data['account']->id,
        'period_start' => now()->startOfMonth(),
        'period_end' => now()->endOfMonth(),
        'status' => 'approved',
    ]);

    for ($i = 0; $i < 10; $i++) {
        PayrollPeriodItem::factory()->for($period)->for($data['employee'])->create([
            'account_id' => $data['account']->id,
        ]);
    }

    $this->get(route('payroll.payslips.show', $data['employee']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('items.data', 5),
        );
});
