<?php

use App\Models\Account;
use App\Models\Employee;
use App\Models\Holiday;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function actingAsHolidayStaff(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

function actingAsHolidayAdmin(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    $perm = Permission::firstOrCreate(['slug' => 'admin.manage_holidays'], [
        'name' => 'admin.manage_holidays',
        'group' => 'admin',
    ]);
    $role->permissions()->attach($perm->id, ['scope' => 'account']);

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

test('guest cannot access holidays', function () {
    $this->get(route('holidays.index'))->assertRedirect(route('login'));
    $this->post(route('holidays.store'))->assertRedirect(route('login'));
    $this->put(route('holidays.update', 1))->assertRedirect(route('login'));
    $this->delete(route('holidays.destroy', 1))->assertRedirect(route('login'));
});

test('staff cannot access holidays index', function () {
    actingAsHolidayStaff();

    $this->get(route('holidays.index'))
        ->assertStatus(403);
});

test('staff cannot create holiday', function () {
    actingAsHolidayStaff();

    $this->post(route('holidays.store'), [
        'name' => 'Holiday',
        'date' => '2025-07-04',
        'type' => 'regular',
    ])
        ->assertStatus(403);
});

test('staff cannot delete holiday', function () {
    $data = actingAsHolidayStaff();

    $holiday = Holiday::create([
        'account_id' => $data['account']->id,
        'name' => 'Holiday',
        'date' => '2025-05-01',
        'type' => 'special',
    ]);

    $this->delete(route('holidays.destroy', $holiday))
        ->assertStatus(403);
});

test('admin can view holidays', function () {
    $data = actingAsHolidayAdmin();

    Holiday::create([
        'account_id' => $data['account']->id,
        'name' => 'New Year',
        'date' => '2025-01-01',
        'type' => 'regular',
    ]);

    $this->get(route('holidays.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/holidays/index')
            ->has('holidays', 1),
        );
});

test('admin can create holiday', function () {
    $data = actingAsHolidayAdmin();

    $this->post(route('holidays.store'), [
        'name' => 'Independence Day',
        'date' => '2025-06-12',
        'type' => 'regular',
    ])
        ->assertRedirect()
        ->assertSessionHas('flash.success');

    $this->assertDatabaseHas('holidays', [
        'name' => 'Independence Day',
        'type' => 'regular',
    ]);
});

test('holiday date must be unique', function () {
    $data = actingAsHolidayAdmin();

    Holiday::create([
        'account_id' => $data['account']->id,
        'name' => 'Existing Holiday',
        'date' => '2025-06-12',
        'type' => 'regular',
    ]);

    $this->post(route('holidays.store'), [
        'name' => 'Another Holiday',
        'date' => '2025-06-12',
        'type' => 'regular',
    ])
        ->assertSessionHasErrors('date');
});

test('admin can update holiday', function () {
    $data = actingAsHolidayAdmin();

    $holiday = Holiday::create([
        'account_id' => $data['account']->id,
        'name' => 'Old Name',
        'date' => '2025-12-25',
        'type' => 'regular',
    ]);

    $this->put(route('holidays.update', $holiday), [
        'name' => 'Christmas Day',
        'date' => '2025-12-25',
        'type' => 'regular',
    ])
        ->assertRedirect()
        ->assertSessionHas('flash.success');

    $this->assertDatabaseHas('holidays', [
        'id' => $holiday->id,
        'name' => 'Christmas Day',
    ]);
});

test('admin can delete holiday', function () {
    $data = actingAsHolidayAdmin();

    $holiday = Holiday::create([
        'account_id' => $data['account']->id,
        'name' => 'To Delete',
        'date' => '2025-05-01',
        'type' => 'special',
    ]);

    $this->delete(route('holidays.destroy', $holiday))
        ->assertRedirect()
        ->assertSessionHas('flash.success');

    $this->assertDatabaseMissing('holidays', ['id' => $holiday->id]);
});

test('holiday validates type must be regular or special', function () {
    $data = actingAsHolidayAdmin();

    $this->post(route('holidays.store'), [
        'name' => 'Bad Holiday',
        'date' => '2025-07-04',
        'type' => 'invalid-type',
    ])
        ->assertSessionHasErrors('type');
});

test('holiday validates name is required', function () {
    $data = actingAsHolidayAdmin();

    $this->post(route('holidays.store'), [
        'date' => '2025-07-04',
        'type' => 'regular',
    ])
        ->assertSessionHasErrors('name');
});

test('holiday validates date is required', function () {
    $data = actingAsHolidayAdmin();

    $this->post(route('holidays.store'), [
        'name' => 'No Date',
        'type' => 'regular',
    ])
        ->assertSessionHasErrors('date');
});
