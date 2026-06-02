<?php

use App\Models\Account;
use App\Models\AttendanceCorrectionRequest;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAsCorrectionStaff(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    foreach (['corrections.submit'] as $slug) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'corrections',
        ]);
        $role->permissions()->attach($perm->id, ['scope' => 'self']);
    }

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

function actingAsCorrectionAdmin(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    foreach (['corrections.approve'] as $slug) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'corrections',
        ]);
        $role->permissions()->attach($perm->id, ['scope' => 'account']);
    }

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

test('staff can view corrections index', function () {
    actingAsCorrectionStaff();

    $response = $this->get(route('corrections.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('attendance/corrections/index'));
});

test('staff can submit correction request', function () {
    $data = actingAsCorrectionStaff();

    $response = $this->from(route('corrections.index'))
        ->post(route('corrections.store'), [
            'date' => now()->toDateString(),
            'correction_type' => 'missed_punch_in',
            'requested_in' => '08:00',
            'reason' => 'Forgot to punch in',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('attendance_correction_requests', [
        'employee_id' => $data['employee']->id,
        'status' => 'pending',
        'correction_type' => 'missed_punch_in',
    ]);
});

test('duplicate pending correction is blocked', function () {
    $data = actingAsCorrectionStaff();

    $date = now()->toDateString();

    AttendanceCorrectionRequest::create([
        'account_id' => $data['account']->id,
        'employee_id' => $data['employee']->id,
        'date' => $date,
        'correction_type' => 'missed_punch_in',
        'reason' => 'First request',
        'status' => 'pending',
    ]);

    $response = $this->from(route('corrections.index'))
        ->post(route('corrections.store'), [
            'date' => $date,
            'correction_type' => 'missed_punch_in',
            'requested_in' => '08:00',
            'reason' => 'Second attempt',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('flash.error');

    $this->assertDatabaseCount('attendance_correction_requests', 1);
});

test('correction validates required fields', function () {
    actingAsCorrectionStaff();

    $response = $this->from(route('corrections.index'))
        ->post(route('corrections.store'), []);

    $response->assertSessionHasErrors(['date', 'correction_type', 'reason']);
});

test('admin can approve missed_punch_in correction', function () {
    $staffData = actingAsCorrectionStaff();

    $correction = AttendanceCorrectionRequest::create([
        'account_id' => $staffData['account']->id,
        'employee_id' => $staffData['employee']->id,
        'date' => now()->toDateString(),
        'correction_type' => 'missed_punch_in',
        'requested_in' => '08:00',
        'reason' => 'Forgot to punch in',
        'status' => 'pending',
    ]);

    $adminRole = Role::factory()->for($staffData['account'])->create();
    $perm = Permission::firstOrCreate(['slug' => 'corrections.approve'], [
        'name' => 'corrections.approve',
        'group' => 'corrections',
    ]);
    $adminRole->permissions()->attach($perm->id, ['scope' => 'account']);
    $adminEmployee = Employee::factory()->for($staffData['account'])->withRole($adminRole)->create();
    $adminUser = User::factory()->create(['employee_id' => $adminEmployee->id]);
    $this->actingAs($adminUser);

    $response = $this->from(route('corrections.index'))
        ->patch(route('corrections.approve', $correction));

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('attendance_correction_requests', [
        'id' => $correction->id,
        'status' => 'approved',
        'reviewed_by' => $adminEmployee->id,
    ]);

    $this->assertDatabaseHas('time_logs', [
        'employee_id' => $staffData['employee']->id,
        'type' => 'in',
        'source' => 'correction',
    ]);

    $this->assertDatabaseHas('attendance_sheets', [
        'employee_id' => $staffData['employee']->id,
        'date' => now()->toDateString().' 00:00:00',
    ]);
});

test('admin can approve absent_to_present correction with both times', function () {
    $staffData = actingAsCorrectionStaff();

    $correction = AttendanceCorrectionRequest::create([
        'account_id' => $staffData['account']->id,
        'employee_id' => $staffData['employee']->id,
        'date' => now()->toDateString(),
        'correction_type' => 'absent_to_present',
        'requested_in' => '08:00',
        'requested_out' => '17:00',
        'reason' => 'Was present but system was down',
        'status' => 'pending',
    ]);

    $adminRole = Role::factory()->for($staffData['account'])->create();
    $perm = Permission::firstOrCreate(['slug' => 'corrections.approve'], [
        'name' => 'corrections.approve',
        'group' => 'corrections',
    ]);
    $adminRole->permissions()->attach($perm->id, ['scope' => 'account']);
    $adminEmployee = Employee::factory()->for($staffData['account'])->withRole($adminRole)->create();
    $adminUser = User::factory()->create(['employee_id' => $adminEmployee->id]);
    $this->actingAs($adminUser);

    $response = $this->from(route('corrections.index'))
        ->patch(route('corrections.approve', $correction));

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('time_logs', [
        'employee_id' => $staffData['employee']->id,
        'type' => 'in',
        'source' => 'correction',
    ]);

    $this->assertDatabaseHas('time_logs', [
        'employee_id' => $staffData['employee']->id,
        'type' => 'out',
        'source' => 'correction',
    ]);

    $this->assertDatabaseHas('attendance_sheets', [
        'employee_id' => $staffData['employee']->id,
        'date' => now()->toDateString().' 00:00:00',
        'is_present' => 1,
    ]);
});

test('admin can deny correction', function () {
    $staffData = actingAsCorrectionStaff();

    $correction = AttendanceCorrectionRequest::create([
        'account_id' => $staffData['account']->id,
        'employee_id' => $staffData['employee']->id,
        'date' => now()->toDateString(),
        'correction_type' => 'missed_punch_in',
        'requested_in' => '08:00',
        'reason' => 'Forgot to punch in',
        'status' => 'pending',
    ]);

    $adminRole = Role::factory()->for($staffData['account'])->create();
    $perm = Permission::firstOrCreate(['slug' => 'corrections.approve'], [
        'name' => 'corrections.approve',
        'group' => 'corrections',
    ]);
    $adminRole->permissions()->attach($perm->id, ['scope' => 'account']);
    $adminEmployee = Employee::factory()->for($staffData['account'])->withRole($adminRole)->create();
    $adminUser = User::factory()->create(['employee_id' => $adminEmployee->id]);
    $this->actingAs($adminUser);

    $response = $this->from(route('corrections.index'))
        ->patch(route('corrections.deny', $correction), [
            'denial_reason' => 'Not a valid reason',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('attendance_correction_requests', [
        'id' => $correction->id,
        'status' => 'denied',
        'denial_reason' => 'Not a valid reason',
    ]);
});
