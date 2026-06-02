<?php

use App\Models\Account;
use App\Models\AttendanceSheet;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAsSheetsStaff(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

function actingAsSheetsAdmin(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    foreach (['attendance.view_branch', 'attendance.create_manual'] as $slug) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'attendance',
        ]);
        $role->permissions()->attach($perm->id, ['scope' => 'account']);
    }

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

test('staff cannot view sheets index', function () {
    actingAsSheetsStaff();

    $response = $this->get(route('attendance.sheets.index'));

    $response->assertStatus(403);
});

test('admin can view sheets index', function () {
    $data = actingAsSheetsAdmin();

    $response = $this->get(route('attendance.sheets.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('attendance/sheets/index'));
});

test('admin can search sheets by employee name', function () {
    $data = actingAsSheetsAdmin();

    $staffEmployee = Employee::factory()->for($data['account'])->create([
        'first_name' => 'John',
        'last_name' => 'Doe',
    ]);

    AttendanceSheet::create([
        'account_id' => $data['account']->id,
        'employee_id' => $staffEmployee->id,
        'date' => now()->toDateString().' 00:00:00',
        'schedule_start' => '08:00',
        'schedule_end' => '17:00',
        'is_present' => 1,
    ]);

    AttendanceSheet::create([
        'account_id' => $data['account']->id,
        'employee_id' => $data['employee']->id,
        'date' => now()->toDateString().' 00:00:00',
        'schedule_start' => '08:00',
        'schedule_end' => '17:00',
        'is_present' => 1,
    ]);

    $response = $this->get(route('attendance.sheets.index', ['search' => 'John']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('attendance/sheets/index'));
});

test('admin can filter sheets by account', function () {
    $data = actingAsSheetsAdmin();

    $otherAccount = Account::factory()->create();
    $otherEmployee = Employee::factory()->for($otherAccount)->create();

    AttendanceSheet::create([
        'account_id' => $otherAccount->id,
        'employee_id' => $otherEmployee->id,
        'date' => now()->toDateString().' 00:00:00',
        'schedule_start' => '08:00',
        'schedule_end' => '17:00',
        'is_present' => 1,
    ]);

    AttendanceSheet::create([
        'account_id' => $data['account']->id,
        'employee_id' => $data['employee']->id,
        'date' => now()->toDateString().' 00:00:00',
        'schedule_start' => '08:00',
        'schedule_end' => '17:00',
        'is_present' => 1,
    ]);

    $response = $this->get(route('attendance.sheets.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('attendance/sheets/index'));
});

test('admin can create manual time log', function () {
    $data = actingAsSheetsAdmin();

    $staffEmployee = Employee::factory()->for($data['account'])->create();

    $punchedAt = now()->subHours(3)->format('Y-m-d H:i:s');

    $response = $this->from(route('attendance.sheets.index'))
        ->post(route('attendance.sheets.manual'), [
            'employee_id' => $staffEmployee->id,
            'type' => 'in',
            'punched_at' => $punchedAt,
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('time_logs', [
        'employee_id' => $staffEmployee->id,
        'type' => 'in',
        'source' => 'manual',
    ]);

    $this->assertDatabaseHas('attendance_sheets', [
        'employee_id' => $staffEmployee->id,
    ]);
});

test('manual time log validates employee is required', function () {
    $data = actingAsSheetsAdmin();

    $response = $this->from(route('attendance.sheets.index'))
        ->post(route('attendance.sheets.manual'), []);

    $response->assertSessionHasErrors('employee_id');
});
