<?php

use App\Models\Account;
use App\Models\CompanyConfiguration;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function actingAsConfigStaff(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

function actingAsConfigAdmin(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    $perm = Permission::firstOrCreate(['slug' => 'admin.manage_config'], [
        'name' => 'admin.manage_config',
        'group' => 'admin',
    ]);
    $role->permissions()->attach($perm->id, ['scope' => 'account']);

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

test('guest cannot access config', function () {
    $this->get(route('config.index'))->assertRedirect(route('login'));
    $this->put(route('config.update'))->assertRedirect(route('login'));
});

test('staff cannot access config', function () {
    actingAsConfigStaff();

    $this->get(route('config.index'))
        ->assertStatus(403);
});

test('admin can view config', function () {
    $data = actingAsConfigAdmin();

    CompanyConfiguration::factory()->create([
        'account_id' => $data['account']->id,
        'key' => 'philhealth_premium_percent',
        'value' => '3.5',
    ]);
    CompanyConfiguration::factory()->create([
        'account_id' => $data['account']->id,
        'key' => 'pagibig_monthly_share',
        'value' => '100',
    ]);

    $this->get(route('config.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/config/index')
            ->has('configs'),
        );
});

test('admin can update config', function () {
    $data = actingAsConfigAdmin();

    $this->put(route('config.update'), [
        'philhealth_premium_percent' => 4.5,
        'pagibig_monthly_share' => 150,
    ])
        ->assertRedirect()
        ->assertSessionHas('flash.success');

    $this->assertDatabaseHas('company_configurations', [
        'key' => 'philhealth_premium_percent',
        'value' => '4.5',
    ]);
    $this->assertDatabaseHas('company_configurations', [
        'key' => 'pagibig_monthly_share',
        'value' => '150',
    ]);
});

test('config validates philhealth_premium_percent is numeric', function () {
    $data = actingAsConfigAdmin();

    $this->put(route('config.update'), [
        'philhealth_premium_percent' => 'not-a-number',
    ])
        ->assertSessionHasErrors('philhealth_premium_percent');
});

test('config validates philhealth_premium_percent max is 100', function () {
    $data = actingAsConfigAdmin();

    $this->put(route('config.update'), [
        'philhealth_premium_percent' => 101,
    ])
        ->assertSessionHasErrors('philhealth_premium_percent');
});

test('config validates philhealth_premium_percent min is 0', function () {
    $data = actingAsConfigAdmin();

    $this->put(route('config.update'), [
        'philhealth_premium_percent' => -1,
    ])
        ->assertSessionHasErrors('philhealth_premium_percent');
});

test('config validates pagibig_monthly_share is numeric', function () {
    $data = actingAsConfigAdmin();

    $this->put(route('config.update'), [
        'pagibig_monthly_share' => 'abc',
    ])
        ->assertSessionHasErrors('pagibig_monthly_share');
});

test('config validates pagibig_monthly_share min is 0', function () {
    $data = actingAsConfigAdmin();

    $this->put(route('config.update'), [
        'pagibig_monthly_share' => -10,
    ])
        ->assertSessionHasErrors('pagibig_monthly_share');
});

test('config null values are accepted and skip update', function () {
    $data = actingAsConfigAdmin();

    CompanyConfiguration::factory()->create([
        'account_id' => $data['account']->id,
        'key' => 'philhealth_premium_percent',
        'value' => '3.5',
    ]);

    $this->put(route('config.update'), [
        'philhealth_premium_percent' => null,
        'pagibig_monthly_share' => 200,
    ])
        ->assertRedirect()
        ->assertSessionHas('flash.success');

    $this->assertDatabaseHas('company_configurations', [
        'key' => 'philhealth_premium_percent',
        'value' => '3.5',
    ]);
});
