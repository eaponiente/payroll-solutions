<?php

use App\Models\Account;
use App\Models\Employee;
use App\Models\OvertimeRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAsOvertimeStaff(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    foreach (['overtime.submit'] as $slug) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'overtime',
        ]);
        $role->permissions()->attach($perm->id, ['scope' => 'self']);
    }

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

function actingAsOvertimeAdmin(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    foreach (['overtime.approve', 'overtime.submit'] as $slug) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'overtime',
        ]);
        $role->permissions()->attach($perm->id, ['scope' => 'account']);
    }

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

test('staff can view overtime index', function () {
    actingAsOvertimeStaff();

    $response = $this->get(route('overtime.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('attendance/overtime/index'));
});

test('staff can submit overtime request', function () {
    $data = actingAsOvertimeStaff();

    $response = $this->from(route('overtime.index'))
        ->post(route('overtime.store'), [
            'date' => now()->addDay()->toDateString(),
            'requested_minutes' => 120,
            'reason' => 'Project deadline',
            'shift_type' => 'regular_day',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('overtime_requests', [
        'employee_id' => $data['employee']->id,
        'status' => 'pending',
        'requested_minutes' => 120,
        'shift_type' => 'regular_day',
    ]);
});

test('overtime request validates required fields', function () {
    actingAsOvertimeStaff();

    $response = $this->from(route('overtime.index'))
        ->post(route('overtime.store'), []);

    $response->assertSessionHasErrors(['date', 'requested_minutes', 'reason', 'shift_type']);
});

test('admin can approve overtime request', function () {
    $staffData = actingAsOvertimeStaff();

    $overtime = OvertimeRequest::create([
        'account_id' => $staffData['account']->id,
        'employee_id' => $staffData['employee']->id,
        'date' => now()->toDateString(),
        'requested_minutes' => 120,
        'reason' => 'Project deadline',
        'shift_type' => 'regular_day',
        'status' => 'pending',
    ]);

    $adminRole = Role::factory()->for($staffData['account'])->create();
    foreach (['overtime.approve', 'overtime.submit'] as $slug) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'overtime',
        ]);
        $adminRole->permissions()->attach($perm->id, ['scope' => 'account']);
    }
    $adminEmployee = Employee::factory()->for($staffData['account'])->withRole($adminRole)->create();
    $adminUser = User::factory()->create(['employee_id' => $adminEmployee->id]);
    $this->actingAs($adminUser);

    $response = $this->from(route('overtime.index'))
        ->patch(route('overtime.approve', $overtime));

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('overtime_requests', [
        'id' => $overtime->id,
        'status' => 'approved',
        'approved_by' => $adminEmployee->id,
        'multiplier' => 1.250,
    ]);
});

test('staff cannot approve overtime', function () {
    $staffData = actingAsOvertimeStaff();

    $overtime = OvertimeRequest::create([
        'account_id' => $staffData['account']->id,
        'employee_id' => $staffData['employee']->id,
        'date' => now()->toDateString(),
        'requested_minutes' => 120,
        'reason' => 'Project deadline',
        'shift_type' => 'regular_day',
        'status' => 'pending',
    ]);

    $response = $this->from(route('overtime.index'))
        ->patch(route('overtime.approve', $overtime));

    $response->assertStatus(403);
});

test('admin can deny overtime request', function () {
    $staffData = actingAsOvertimeStaff();

    $overtime = OvertimeRequest::create([
        'account_id' => $staffData['account']->id,
        'employee_id' => $staffData['employee']->id,
        'date' => now()->toDateString(),
        'requested_minutes' => 120,
        'reason' => 'Project deadline',
        'shift_type' => 'regular_day',
        'status' => 'pending',
    ]);

    $adminRole = Role::factory()->for($staffData['account'])->create();
    foreach (['overtime.approve', 'overtime.submit'] as $slug) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'overtime',
        ]);
        $adminRole->permissions()->attach($perm->id, ['scope' => 'account']);
    }
    $adminEmployee = Employee::factory()->for($staffData['account'])->withRole($adminRole)->create();
    $adminUser = User::factory()->create(['employee_id' => $adminEmployee->id]);
    $this->actingAs($adminUser);

    $response = $this->from(route('overtime.index'))
        ->patch(route('overtime.deny', $overtime), [
            'denial_reason' => 'Not enough budget',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('overtime_requests', [
        'id' => $overtime->id,
        'status' => 'denied',
        'denial_reason' => 'Not enough budget',
    ]);
});

test('deny requires denial reason', function () {
    $staffData = actingAsOvertimeStaff();

    $overtime = OvertimeRequest::create([
        'account_id' => $staffData['account']->id,
        'employee_id' => $staffData['employee']->id,
        'date' => now()->toDateString(),
        'requested_minutes' => 120,
        'reason' => 'Project deadline',
        'shift_type' => 'regular_day',
        'status' => 'pending',
    ]);

    $adminRole = Role::factory()->for($staffData['account'])->create();
    foreach (['overtime.approve', 'overtime.submit'] as $slug) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'overtime',
        ]);
        $adminRole->permissions()->attach($perm->id, ['scope' => 'account']);
    }
    $adminEmployee = Employee::factory()->for($staffData['account'])->withRole($adminRole)->create();
    $adminUser = User::factory()->create(['employee_id' => $adminEmployee->id]);
    $this->actingAs($adminUser);

    $response = $this->from(route('overtime.index'))
        ->patch(route('overtime.deny', $overtime), []);

    $response->assertSessionHasErrors('denial_reason');

    $this->assertDatabaseHas('overtime_requests', [
        'id' => $overtime->id,
        'status' => 'pending',
    ]);
});

test('overtime index can filter by status', function () {
    $data = actingAsOvertimeStaff();

    OvertimeRequest::create([
        'account_id' => $data['account']->id,
        'employee_id' => $data['employee']->id,
        'date' => now()->toDateString(),
        'requested_minutes' => 60,
        'reason' => 'Reason 1',
        'shift_type' => 'regular_day',
        'status' => 'pending',
    ]);

    OvertimeRequest::create([
        'account_id' => $data['account']->id,
        'employee_id' => $data['employee']->id,
        'date' => now()->subDay()->toDateString(),
        'requested_minutes' => 30,
        'reason' => 'Reason 2',
        'shift_type' => 'regular_day',
        'status' => 'approved',
    ]);

    $response = $this->get(route('overtime.index', ['status' => 'approved']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('attendance/overtime/index'));
});
