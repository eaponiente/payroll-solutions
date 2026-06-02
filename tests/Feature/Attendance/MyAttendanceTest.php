<?php

use App\Models\Account;
use App\Models\AttendanceSheet;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAsAttendanceUser(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    foreach (['attendance.punch', 'attendance.view_own'] as $slug) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'attendance',
        ]);
        $role->permissions()->attach($perm->id, ['scope' => 'self']);
    }

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

test('guest cannot access my attendance', function () {
    $response = $this->get(route('attendance.my'));

    $response->assertRedirect(route('login'));
});

test('user without employee is redirected', function () {
    $user = User::factory()->create(['employee_id' => null]);
    $this->actingAs($user);

    $response = $this->get(route('attendance.my'));

    $response->assertRedirect(route('employees.create'));
    $response->assertSessionHas('flash.warning');
});

test('staff can view my attendance page', function () {
    actingAsAttendanceUser();

    $response = $this->get(route('attendance.my'));

    $response->assertOk();

    $response->assertInertia(fn ($page) => $page->component('attendance/my'));
});

test('staff sees hasPunchedIn=true after punch in', function () {
    $data = actingAsAttendanceUser();

    $this->from(route('attendance.my'))->post(route('attendance.punch'), ['type' => 'in']);

    $response = $this->get(route('attendance.my'));

    $response->assertInertia(fn ($page) => $page->component('attendance/my')
        ->where('hasPunchedIn', true)
    );
});

test('staff sees todaySheet after punch out', function () {
    $data = actingAsAttendanceUser();

    $this->from(route('attendance.my'))->post(route('attendance.punch'), ['type' => 'in']);
    $this->from(route('attendance.my'))->post(route('attendance.punch'), ['type' => 'out']);

    $response = $this->get(route('attendance.my'));

    $response->assertInertia(fn ($page) => $page->component('attendance/my')
        ->where('hasPunchedOut', true)
        ->has('todaySheet')
    );
});

test('my attendance supports date filters', function () {
    $data = actingAsAttendanceUser();

    AttendanceSheet::create([
        'account_id' => $data['account']->id,
        'employee_id' => $data['employee']->id,
        'date' => now()->subDays(10)->toDateString().' 00:00:00',
        'schedule_start' => '08:00',
        'schedule_end' => '17:00',
        'is_present' => 1,
    ]);
    AttendanceSheet::create([
        'account_id' => $data['account']->id,
        'employee_id' => $data['employee']->id,
        'date' => now()->subDays(5)->toDateString().' 00:00:00',
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

    $response = $this->get(route('attendance.my', [
        'from' => now()->subDays(7)->toDateString(),
        'to' => now()->toDateString(),
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('attendance/my')
        ->has('sheets.data')
    );
});
