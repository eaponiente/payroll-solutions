<?php

use App\Models\Account;
use App\Models\Employee;
use App\Models\Fine;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAsFineStaff(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

function actingAsFineAdmin(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    foreach (['fines.view', 'fines.create'] as $slug) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'fines',
        ]);
        $role->permissions()->attach($perm->id, ['scope' => 'account']);
    }

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

test('staff cannot view fines index', function () {
    actingAsFineStaff();

    $response = $this->get(route('fines.index'));

    $response->assertStatus(403);
});

test('admin can view fines index', function () {
    $data = actingAsFineAdmin();

    $response = $this->get(route('fines.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('attendance/fines/index'));
});

test('admin can record fine', function () {
    $data = actingAsFineAdmin();

    $staffEmployee = Employee::factory()->for($data['account'])->create();

    $response = $this->from(route('fines.index'))
        ->post(route('fines.store'), [
            'employee_id' => $staffEmployee->id,
            'date' => now()->toDateString(),
            'fine_type' => 'Late',
            'amount' => 50.00,
            'reason' => '30 minutes late',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('flash.success');

    $this->assertDatabaseHas('fines', [
        'employee_id' => $staffEmployee->id,
        'fine_type' => 'Late',
        'amount' => '50.00',
        'marked_by' => $data['employee']->id,
    ]);
});

test('fine validates required fields', function () {
    $data = actingAsFineAdmin();

    $response = $this->from(route('fines.index'))
        ->post(route('fines.store'), []);

    $response->assertSessionHasErrors(['employee_id', 'date', 'fine_type', 'amount', 'reason']);
});

test('fines index can filter by employee', function () {
    $data = actingAsFineAdmin();

    $staffEmployee = Employee::factory()->for($data['account'])->create();

    Fine::create([
        'account_id' => $data['account']->id,
        'employee_id' => $staffEmployee->id,
        'date' => now()->toDateString(),
        'fine_type' => 'Late',
        'amount' => 100.00,
        'reason' => 'Late arrival',
        'marked_by' => $data['employee']->id,
    ]);

    Fine::create([
        'account_id' => $data['account']->id,
        'employee_id' => $data['employee']->id,
        'date' => now()->subDay()->toDateString(),
        'fine_type' => 'Absence',
        'amount' => 200.00,
        'reason' => 'Unauthorized absence',
        'marked_by' => $data['employee']->id,
    ]);

    $response = $this->get(route('fines.index', ['employee_id' => $staffEmployee->id]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('attendance/fines/index'));
});

test('fines index can filter by fine type', function () {
    $data = actingAsFineAdmin();

    Fine::create([
        'account_id' => $data['account']->id,
        'employee_id' => $data['employee']->id,
        'date' => now()->toDateString(),
        'fine_type' => 'Late',
        'amount' => 100.00,
        'reason' => 'Late arrival',
        'marked_by' => $data['employee']->id,
    ]);

    Fine::create([
        'account_id' => $data['account']->id,
        'employee_id' => $data['employee']->id,
        'date' => now()->subDay()->toDateString(),
        'fine_type' => 'Absence',
        'amount' => 200.00,
        'reason' => 'Unauthorized absence',
        'marked_by' => $data['employee']->id,
    ]);

    $response = $this->get(route('fines.index', ['fine_type' => 'Late']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('attendance/fines/index'));
});
