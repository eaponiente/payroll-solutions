<?php

use App\Models\Account;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SssContributionBracket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function actingAsSssStaff(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

function actingAsSssAdmin(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    $perm = Permission::firstOrCreate(['slug' => 'admin.manage_sss'], [
        'name' => 'admin.manage_sss',
        'group' => 'admin',
    ]);
    $role->permissions()->attach($perm->id, ['scope' => 'account']);

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

test('guest cannot access sss brackets', function () {
    $this->get(route('sss-brackets.index'))->assertRedirect(route('login'));
    $this->put(route('sss-brackets.update'))->assertRedirect(route('login'));
});

test('staff cannot access sss brackets', function () {
    actingAsSssStaff();

    $this->get(route('sss-brackets.index'))
        ->assertStatus(403);
});

test('admin can view sss brackets', function () {
    $data = actingAsSssAdmin();

    SssContributionBracket::factory()->create([
        'salary_min' => 0,
        'salary_max' => 10000,
        'employee_percentage' => 4.5,
        'employer_percentage' => 8.0,
        'effective_from' => '2025-01-01',
    ]);

    $this->get(route('sss-brackets.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/sss-brackets/index')
            ->has('brackets', 1),
        );
});

test('admin can update sss brackets with bulk replace', function () {
    $data = actingAsSssAdmin();

    SssContributionBracket::factory()->create([
        'salary_min' => 0,
        'salary_max' => 5000,
        'employee_percentage' => 3.5,
        'employer_percentage' => 7.0,
        'effective_from' => '2025-01-01',
    ]);

    $this->put(route('sss-brackets.update'), [
        'brackets' => [
            [
                'salary_min' => 0,
                'salary_max' => 10000,
                'employee_percentage' => 4.0,
                'employer_percentage' => 8.0,
                'effective_from' => '2025-06-01',
            ],
            [
                'salary_min' => 10000.01,
                'salary_max' => 20000,
                'employee_percentage' => 5.0,
                'employer_percentage' => 10.0,
                'effective_from' => '2025-06-01',
            ],
        ],
    ])
        ->assertRedirect()
        ->assertSessionHas('flash.success');

    expect(SssContributionBracket::count())->toBe(2);
    $this->assertDatabaseHas('sss_contribution_brackets', [
        'salary_min' => 0.00,
        'employee_percentage' => 4.00,
    ]);
    $this->assertDatabaseMissing('sss_contribution_brackets', [
        'salary_min' => 0.00,
        'employee_percentage' => 3.50,
    ]);
});

test('sss brackets validates brackets array is required', function () {
    $data = actingAsSssAdmin();

    $this->put(route('sss-brackets.update'), [])
        ->assertSessionHasErrors('brackets');
});

test('sss brackets validates brackets array min 1', function () {
    $data = actingAsSssAdmin();

    $this->put(route('sss-brackets.update'), [
        'brackets' => [],
    ])
        ->assertSessionHasErrors('brackets');
});

test('sss brackets validates salary_min is required', function () {
    $data = actingAsSssAdmin();

    $this->put(route('sss-brackets.update'), [
        'brackets' => [
            [
                'salary_max' => 10000,
                'employee_percentage' => 4.0,
                'employer_percentage' => 8.0,
                'effective_from' => '2025-06-01',
            ],
        ],
    ])
        ->assertSessionHasErrors('brackets.0.salary_min');
});

test('sss brackets validates employee_percentage is required', function () {
    $data = actingAsSssAdmin();

    $this->put(route('sss-brackets.update'), [
        'brackets' => [
            [
                'salary_min' => 0,
                'salary_max' => 10000,
                'employer_percentage' => 8.0,
                'effective_from' => '2025-06-01',
            ],
        ],
    ])
        ->assertSessionHasErrors('brackets.0.employee_percentage');
});

test('sss brackets validates employer_percentage is required', function () {
    $data = actingAsSssAdmin();

    $this->put(route('sss-brackets.update'), [
        'brackets' => [
            [
                'salary_min' => 0,
                'salary_max' => 10000,
                'employee_percentage' => 4.0,
                'effective_from' => '2025-06-01',
            ],
        ],
    ])
        ->assertSessionHasErrors('brackets.0.employer_percentage');
});

test('sss brackets validates effective_from is required', function () {
    $data = actingAsSssAdmin();

    $this->put(route('sss-brackets.update'), [
        'brackets' => [
            [
                'salary_min' => 0,
                'salary_max' => 10000,
                'employee_percentage' => 4.0,
                'employer_percentage' => 8.0,
            ],
        ],
    ])
        ->assertSessionHasErrors('brackets.0.effective_from');
});

test('sss brackets validates salary_min is numeric', function () {
    $data = actingAsSssAdmin();

    $this->put(route('sss-brackets.update'), [
        'brackets' => [
            [
                'salary_min' => 'abc',
                'salary_max' => 10000,
                'employee_percentage' => 4.0,
                'employer_percentage' => 8.0,
                'effective_from' => '2025-06-01',
            ],
        ],
    ])
        ->assertSessionHasErrors('brackets.0.salary_min');
});

test('sss brackets bulk replace deletes old records', function () {
    $data = actingAsSssAdmin();

    SssContributionBracket::factory()->count(3)->create();

    expect(SssContributionBracket::count())->toBe(3);

    $this->put(route('sss-brackets.update'), [
        'brackets' => [
            [
                'salary_min' => 0,
                'salary_max' => 50000,
                'employee_percentage' => 5.0,
                'employer_percentage' => 10.0,
                'effective_from' => '2025-01-01',
            ],
        ],
    ])
        ->assertRedirect()
        ->assertSessionHas('flash.success');

    expect(SssContributionBracket::count())->toBe(1);
});
