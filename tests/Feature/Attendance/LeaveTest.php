<?php

use App\Models\Account;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAsLeaveStaff(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    foreach (['leaves.submit'] as $slug) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'leaves',
        ]);
        $role->permissions()->attach($perm->id, ['scope' => 'self']);
    }

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

function actingAsLeaveAdmin(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    foreach (['leaves.approve'] as $slug) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'leaves',
        ]);
        $role->permissions()->attach($perm->id, ['scope' => 'account']);
    }

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

test('staff can view leave index', function () {
    actingAsLeaveStaff();

    $response = $this->get(route('leave.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('attendance/leaves/index'));
});

test('staff can submit leave request', function () {
    $data = actingAsLeaveStaff();

    $response = $this->from(route('leave.index'))
        ->post(route('leave.store'), [
            'date' => now()->addDays(3)->toDateString(),
            'leave_type' => 'vacation',
            'duration' => 'full_day',
            'reason' => 'Family vacation',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('leave_requests', [
        'employee_id' => $data['employee']->id,
        'status' => 'pending',
        'leave_type' => 'vacation',
        'is_paid' => true,
    ]);
});

test('leave request shows warning when 5 leaves used', function () {
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    $perm = Permission::firstOrCreate(['slug' => 'leaves.submit'], [
        'name' => 'leaves.submit',
        'group' => 'leaves',
    ]);
    $role->permissions()->attach($perm->id, ['scope' => 'self']);

    $employee = Employee::factory()->for($account)->withRole($role)->create([
        'leaves_used_this_year' => 5,
    ]);
    $user = User::factory()->create(['employee_id' => $employee->id]);
    $this->actingAs($user);

    $response = $this->from(route('leave.index'))
        ->post(route('leave.store'), [
            'date' => now()->addDays(3)->toDateString(),
            'leave_type' => 'vacation',
            'duration' => 'full_day',
            'reason' => 'Need a break',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('flash.warning');

    $this->assertDatabaseMissing('leave_requests', [
        'employee_id' => $employee->id,
        'status' => 'pending',
    ]);
});

test('leave request validates required fields', function () {
    actingAsLeaveStaff();

    $response = $this->from(route('leave.index'))
        ->post(route('leave.store'), []);

    $response->assertSessionHasErrors(['date', 'leave_type', 'duration', 'reason']);
});

test('admin can approve leave request', function () {
    $staffData = actingAsLeaveStaff();

    $leave = LeaveRequest::create([
        'account_id' => $staffData['account']->id,
        'employee_id' => $staffData['employee']->id,
        'date' => now()->addDays(3)->toDateString(),
        'leave_type' => 'vacation',
        'duration' => 'full_day',
        'is_paid' => true,
        'reason' => 'Family vacation',
        'status' => 'pending',
    ]);

    $adminRole = Role::factory()->for($staffData['account'])->create();
    $perm = Permission::firstOrCreate(['slug' => 'leaves.approve'], [
        'name' => 'leaves.approve',
        'group' => 'leaves',
    ]);
    $adminRole->permissions()->attach($perm->id, ['scope' => 'account']);
    $adminEmployee = Employee::factory()->for($staffData['account'])->withRole($adminRole)->create();
    $adminUser = User::factory()->create(['employee_id' => $adminEmployee->id]);
    $this->actingAs($adminUser);

    $response = $this->from(route('leave.index'))
        ->patch(route('leave.approve', $leave));

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('leave_requests', [
        'id' => $leave->id,
        'status' => 'approved',
        'approved_by' => $adminEmployee->id,
    ]);

    $this->assertDatabaseHas('employees', [
        'id' => $staffData['employee']->id,
        'leaves_used_this_year' => 1,
    ]);
});

test('admin can deny leave request', function () {
    $staffData = actingAsLeaveStaff();

    $leave = LeaveRequest::create([
        'account_id' => $staffData['account']->id,
        'employee_id' => $staffData['employee']->id,
        'date' => now()->addDays(3)->toDateString(),
        'leave_type' => 'vacation',
        'duration' => 'full_day',
        'is_paid' => true,
        'reason' => 'Family vacation',
        'status' => 'pending',
    ]);

    $adminRole = Role::factory()->for($staffData['account'])->create();
    $perm = Permission::firstOrCreate(['slug' => 'leaves.approve'], [
        'name' => 'leaves.approve',
        'group' => 'leaves',
    ]);
    $adminRole->permissions()->attach($perm->id, ['scope' => 'account']);
    $adminEmployee = Employee::factory()->for($staffData['account'])->withRole($adminRole)->create();
    $adminUser = User::factory()->create(['employee_id' => $adminEmployee->id]);
    $this->actingAs($adminUser);

    $response = $this->from(route('leave.index'))
        ->patch(route('leave.deny', $leave), [
            'denial_reason' => 'Staff shortage on that date',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('leave_requests', [
        'id' => $leave->id,
        'status' => 'denied',
        'denial_reason' => 'Staff shortage on that date',
    ]);
});

test('unpaid leave does not increment count on approve', function () {
    $staffData = actingAsLeaveStaff();

    $leave = LeaveRequest::create([
        'account_id' => $staffData['account']->id,
        'employee_id' => $staffData['employee']->id,
        'date' => now()->addDays(5)->toDateString(),
        'leave_type' => 'unpaid',
        'duration' => 'full_day',
        'is_paid' => false,
        'reason' => 'Personal matters',
        'status' => 'pending',
    ]);

    $adminRole = Role::factory()->for($staffData['account'])->create();
    $perm = Permission::firstOrCreate(['slug' => 'leaves.approve'], [
        'name' => 'leaves.approve',
        'group' => 'leaves',
    ]);
    $adminRole->permissions()->attach($perm->id, ['scope' => 'account']);
    $adminEmployee = Employee::factory()->for($staffData['account'])->withRole($adminRole)->create();
    $adminUser = User::factory()->create(['employee_id' => $adminEmployee->id]);
    $this->actingAs($adminUser);

    $response = $this->from(route('leave.index'))
        ->patch(route('leave.approve', $leave));

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('leave_requests', [
        'id' => $leave->id,
        'status' => 'approved',
    ]);

    $this->assertDatabaseHas('employees', [
        'id' => $staffData['employee']->id,
        'leaves_used_this_year' => 0,
    ]);
});

test('leave index can filter by status', function () {
    $data = actingAsLeaveStaff();

    LeaveRequest::create([
        'account_id' => $data['account']->id,
        'employee_id' => $data['employee']->id,
        'date' => now()->addDays(3)->toDateString(),
        'leave_type' => 'vacation',
        'duration' => 'full_day',
        'is_paid' => true,
        'reason' => 'Request 1',
        'status' => 'pending',
    ]);

    LeaveRequest::create([
        'account_id' => $data['account']->id,
        'employee_id' => $data['employee']->id,
        'date' => now()->subDay()->toDateString(),
        'leave_type' => 'sick',
        'duration' => 'full_day',
        'is_paid' => true,
        'reason' => 'Request 2',
        'status' => 'approved',
    ]);

    $response = $this->get(route('leave.index', ['status' => 'approved']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('attendance/leaves/index'));
});
