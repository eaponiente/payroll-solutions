<?php

use App\Models\Account;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAsPunchUser(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    $perm = Permission::firstOrCreate(['slug' => 'attendance.punch'], [
        'name' => 'attendance.punch',
        'group' => 'attendance',
    ]);
    $role->permissions()->attach($perm->id, ['scope' => 'self']);

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

test('guest cannot punch', function () {
    $response = $this->post(route('attendance.punch'), ['type' => 'in']);

    $response->assertRedirect(route('login'));
});

test('staff can punch in', function () {
    $data = actingAsPunchUser();

    $response = $this->from(route('attendance.my'))
        ->post(route('attendance.punch'), ['type' => 'in']);

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('time_logs', [
        'employee_id' => $data['employee']->id,
        'type' => 'in',
        'source' => 'self_service',
    ]);
});

test('staff can punch out', function () {
    $data = actingAsPunchUser();

    $this->from(route('attendance.my'))->post(route('attendance.punch'), ['type' => 'in']);

    $response = $this->from(route('attendance.my'))
        ->post(route('attendance.punch'), ['type' => 'out']);

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('time_logs', [
        'employee_id' => $data['employee']->id,
        'type' => 'out',
        'source' => 'self_service',
    ]);

    $this->assertDatabaseHas('attendance_sheets', [
        'employee_id' => $data['employee']->id,
        'date' => now()->toDateString().' 00:00:00',
        'is_present' => 1,
    ]);
});

test('duplicate punch within 5 min is detected', function () {
    $data = actingAsPunchUser();

    $existing = TimeLog::create([
        'account_id' => $data['account']->id,
        'employee_id' => $data['employee']->id,
        'type' => 'in',
        'source' => 'self_service',
        'punched_at' => now()->subMinutes(2),
    ]);

    $response = $this->from(route('attendance.my'))
        ->post(route('attendance.punch'), ['type' => 'in']);

    $response->assertRedirect();

    $this->assertDatabaseHas('time_logs', [
        'employee_id' => $data['employee']->id,
        'type' => 'in',
        'duplicate_of' => $existing->id,
    ]);
});

test('inactive employee cannot punch', function () {
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    $perm = Permission::firstOrCreate(['slug' => 'attendance.punch'], [
        'name' => 'attendance.punch',
        'group' => 'attendance',
    ]);
    $role->permissions()->attach($perm->id, ['scope' => 'self']);

    $employee = Employee::factory()->inactive()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    $this->actingAs($user);

    $response = $this->from(route('attendance.my'))
        ->post(route('attendance.punch'), ['type' => 'in']);

    $response->assertRedirect();
    $response->assertSessionHas('flash.error');

    $this->assertDatabaseMissing('time_logs', [
        'employee_id' => $employee->id,
    ]);
});

test('invalid punch type is rejected', function () {
    $data = actingAsPunchUser();

    $response = $this->from(route('attendance.my'))
        ->post(route('attendance.punch'), ['type' => 'invalid_type']);

    $response->assertSessionHasErrors('type');
});

test('staff can punch lunch out', function () {
    $data = actingAsPunchUser();

    $response = $this->from(route('attendance.my'))
        ->post(route('attendance.punch'), ['type' => 'lunch_out']);

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('time_logs', [
        'employee_id' => $data['employee']->id,
        'type' => 'lunch_out',
        'source' => 'self_service',
    ]);
});

test('staff can punch lunch in', function () {
    $data = actingAsPunchUser();

    $response = $this->from(route('attendance.my'))
        ->post(route('attendance.punch'), ['type' => 'lunch_in']);

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('time_logs', [
        'employee_id' => $data['employee']->id,
        'type' => 'lunch_in',
        'source' => 'self_service',
    ]);
});
