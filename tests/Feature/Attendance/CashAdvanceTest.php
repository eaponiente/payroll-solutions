<?php

use App\Models\Account;
use App\Models\CashAdvance;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAsCashAdvanceStaff(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    foreach (['cash_advances.submit'] as $slug) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'cash_advances',
        ]);
        $role->permissions()->attach($perm->id, ['scope' => 'self']);
    }

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

function actingAsCashAdvanceAdmin(?Account $account = null): array
{
    $account ??= Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    foreach (['cash_advances.approve'] as $slug) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'cash_advances',
        ]);
        $role->permissions()->attach($perm->id, ['scope' => 'account']);
    }

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

test('staff can view cash advances index', function () {
    actingAsCashAdvanceStaff();

    $response = $this->get(route('cash-advances.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('attendance/cash-advances/index'));
});

test('staff can submit cash advance request', function () {
    $data = actingAsCashAdvanceStaff();

    $maxReceivable = (float) $data['employee']->current_daily_rate * 6;

    $response = $this->from(route('cash-advances.index'))
        ->post(route('cash-advances.store'), [
            'amount' => $maxReceivable - 100,
            'reason' => 'Medical emergency',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('cash_advances', [
        'employee_id' => $data['employee']->id,
        'status' => 'pending',
    ]);
});

test('duplicate CA is blocked when employee has existing active CA', function () {
    $data = actingAsCashAdvanceStaff();

    $maxReceivable = (float) $data['employee']->current_daily_rate * 6;

    CashAdvance::create([
        'account_id' => $data['account']->id,
        'employee_id' => $data['employee']->id,
        'amount' => $maxReceivable / 2,
        'remaining_balance' => $maxReceivable / 2,
        'reason' => 'First advance',
        'status' => 'approved',
        'requested_by' => $data['employee']->id,
    ]);

    $response = $this->from(route('cash-advances.index'))
        ->post(route('cash-advances.store'), [
            'amount' => $maxReceivable / 2,
            'reason' => 'Second advance attempt',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('flash.error');

    $this->assertDatabaseCount('cash_advances', 1);
});

test('CA amount exceeds max receivable is blocked', function () {
    $data = actingAsCashAdvanceStaff();

    $dailyRate = (float) $data['employee']->current_daily_rate;
    $maxReceivable = $dailyRate * 6;

    $response = $this->from(route('cash-advances.index'))
        ->post(route('cash-advances.store'), [
            'amount' => $maxReceivable + 1,
            'reason' => 'Need extra cash',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('flash.error');

    $this->assertDatabaseCount('cash_advances', 0);
});

test('admin can approve cash advance', function () {
    $staffData = actingAsCashAdvanceStaff();

    $ca = CashAdvance::create([
        'account_id' => $staffData['account']->id,
        'employee_id' => $staffData['employee']->id,
        'amount' => 500,
        'remaining_balance' => 500,
        'reason' => 'Medical emergency',
        'status' => 'pending',
        'requested_by' => $staffData['employee']->id,
    ]);

    $adminData = actingAsCashAdvanceAdmin($staffData['account']);

    $response = $this->from(route('cash-advances.index'))
        ->patch(route('cash-advances.approve', $ca));

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('cash_advances', [
        'id' => $ca->id,
        'status' => 'approved',
        'approved_by' => $adminData['employee']->id,
    ]);
});

test('admin can deny cash advance', function () {
    $staffData = actingAsCashAdvanceStaff();

    $ca = CashAdvance::create([
        'account_id' => $staffData['account']->id,
        'employee_id' => $staffData['employee']->id,
        'amount' => 500,
        'remaining_balance' => 500,
        'reason' => 'Medical emergency',
        'status' => 'pending',
        'requested_by' => $staffData['employee']->id,
    ]);

    $adminData = actingAsCashAdvanceAdmin($staffData['account']);

    $response = $this->from(route('cash-advances.index'))
        ->patch(route('cash-advances.deny', $ca), [
            'denial_reason' => 'Insufficient budget',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('cash_advances', [
        'id' => $ca->id,
        'status' => 'denied',
        'denial_reason' => 'Insufficient budget',
    ]);
});
