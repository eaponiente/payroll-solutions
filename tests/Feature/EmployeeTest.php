<?php

use App\Models\Account;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Salary;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAsAccountUser(array $permissions): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    foreach ($permissions as $slug => $scope) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'test',
        ]);
        $role->permissions()->attach($perm->id, ['scope' => $scope]);
    }

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);

    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

// ──────────────────────────────────────────────────
// Guest / Unauthenticated tests
// ──────────────────────────────────────────────────

test('guest cannot access employee index', function () {
    $this->get(route('employees.index'))->assertRedirect(route('login'));
});

test('guest cannot access employee create', function () {
    $this->get(route('employees.create'))->assertRedirect(route('login'));
});

test('guest cannot store employee', function () {
    $this->post(route('employees.store'), [
        'first_name' => 'Test',
        'last_name' => 'User',
        'position' => 'regular',
        'hire_date' => '2025-01-01',
        'current_daily_rate' => 1000,
        'email' => 'test@example.com',
        'password' => 'password123',
    ])->assertRedirect(route('login'));
});

test('guest cannot view employee show', function () {
    $employee = Employee::factory()->create();

    $this->get(route('employees.show', $employee))->assertRedirect(route('login'));
});

test('guest cannot access employee edit', function () {
    $employee = Employee::factory()->create();

    $this->get(route('employees.edit', $employee))->assertRedirect(route('login'));
});

test('guest cannot update employee', function () {
    $employee = Employee::factory()->create();

    $this->put(route('employees.update', $employee), [
        'first_name' => 'Updated',
        'last_name' => 'Name',
    ])->assertRedirect(route('login'));
});

test('guest cannot delete employee', function () {
    $employee = Employee::factory()->create();

    $this->delete(route('employees.destroy', $employee))->assertRedirect(route('login'));
});

// ──────────────────────────────────────────────────
// Staff role tests (view-only)
// ──────────────────────────────────────────────────

test('staff can view own employee record in index', function () {
    actingAsAccountUser(['employees.view' => 'self']);

    $response = $this->get(route('employees.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('payroll/employees/index')
            ->has('employees.data', 1)
        );
});

test('staff cannot access create page', function () {
    actingAsAccountUser(['employees.view' => 'self']);

    $this->get(route('employees.create'))
        ->assertStatus(403);
});

test('staff cannot access edit page', function () {
    $data = actingAsAccountUser(['employees.view' => 'self']);
    $employee = Employee::factory()->for($data['account'])->create();

    $this->get(route('employees.edit', $employee))
        ->assertStatus(403);
});

test('staff cannot update employee', function () {
    $data = actingAsAccountUser(['employees.view' => 'self']);
    $employee = Employee::factory()->for($data['account'])->create();

    $this->put(route('employees.update', $employee), [
        'first_name' => 'Updated',
        'last_name' => 'Name',
    ])
        ->assertStatus(403);
});

test('staff cannot delete employee', function () {
    $data = actingAsAccountUser(['employees.view' => 'self']);
    $employee = Employee::factory()->for($data['account'])->create();

    $this->delete(route('employees.destroy', $employee))
        ->assertStatus(403);
});

test('staff cannot rehire employee', function () {
    $data = actingAsAccountUser(['employees.view' => 'self']);
    $employee = Employee::factory()->inactive()->for($data['account'])->create();

    $this->post(route('employees.rehire', $employee), [
        'daily_rate' => 1200,
        'rehire_date' => '2025-06-01',
    ])
        ->assertStatus(403);
});

// ──────────────────────────────────────────────────
// Admin role tests (full account permissions)
// ──────────────────────────────────────────────────

test('admin can see all account employees in index', function () {
    $data = actingAsAccountUser(['employees.view' => 'account']);

    Employee::factory()->count(3)->for($data['account'])->create();

    $response = $this->get(route('employees.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('payroll/employees/index')
            ->has('employees.data', 4)
        );
});

test('admin can create employee', function () {
    $data = actingAsAccountUser(['employees.create' => 'account']);

    $response = $this->post(route('employees.store'), [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'middle_name' => 'Smith',
        'position' => 'regular',
        'hire_date' => '2025-01-15',
        'current_daily_rate' => 1000,
        'email' => 'john.doe@example.com',
        'password' => 'password123',
    ]);

    $response->assertRedirect(route('employees.index'))
        ->assertSessionHas('flash.success');

    $this->assertDatabaseHas('employees', [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'middle_name' => 'Smith',
        'position' => 'regular',
        'status' => 'active',
    ]);

    $employee = Employee::where('first_name', 'John')->first();
    expect($employee->employee_number)->toMatch('/^EMP-'.now()->year.'-\d{4}$/');
    expect($employee->role_id)->not->toBeNull();

    $this->assertDatabaseHas('users', [
        'employee_id' => $employee->id,
        'name' => 'John Doe',
        'email' => 'john.doe@example.com',
        'is_enabled' => true,
    ]);
});

test('admin cannot create employee with duplicate email', function () {
    $data = actingAsAccountUser(['employees.create' => 'account']);

    User::factory()->create(['email' => 'john.doe@example.com']);

    $response = $this->post(route('employees.store'), [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'position' => 'regular',
        'hire_date' => '2025-01-15',
        'current_daily_rate' => 1000,
        'email' => 'john.doe@example.com',
        'password' => 'password123',
    ]);

    $response->assertSessionHasErrors('email');
});

test('admin can view employee details', function () {
    $data = actingAsAccountUser(['employees.view' => 'account']);
    $employee = Employee::factory()->for($data['account'])->create();

    $response = $this->get(route('employees.show', $employee));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('payroll/employees/show')
            ->where('employee.id', $employee->id)
        );
});

test('admin can edit employee', function () {
    $data = actingAsAccountUser(['employees.edit' => 'account']);
    $employee = Employee::factory()->for($data['account'])->create();
    User::factory()->create(['employee_id' => $employee->id, 'name' => 'Old Name']);

    $response = $this->put(route('employees.update', $employee), [
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'middle_name' => 'M.',
        'phone' => '09123456789',
        'address' => '123 Main St',
        'sss_number' => 'SSS-001',
        'philhealth_number' => 'PH-001',
        'pagibig_number' => 'PAG-001',
        'tin_number' => 'TIN-001',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('employees', [
        'id' => $employee->id,
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'middle_name' => 'M.',
        'phone' => '09123456789',
        'address' => '123 Main St',
        'sss_number' => 'SSS-001',
        'philhealth_number' => 'PH-001',
        'pagibig_number' => 'PAG-001',
        'tin_number' => 'TIN-001',
    ]);

    $this->assertDatabaseHas('users', [
        'employee_id' => $employee->id,
        'name' => 'Jane Smith',
    ]);
});

test('admin can access salary history', function () {
    $data = actingAsAccountUser(['employees.view' => 'account']);
    $employee = Employee::factory()->for($data['account'])->create();
    Salary::factory()->count(3)->for($employee)->create(['account_id' => $data['account']->id]);

    $response = $this->get(route('employees.salaries', $employee));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('payroll/employees/salaries')
            ->has('salaries', 3)
        );
});

test('admin can add salary', function () {
    $data = actingAsAccountUser(['employees.edit' => 'account']);
    $employee = Employee::factory()->for($data['account'])->create(['current_daily_rate' => 1000]);
    $oldSalary = Salary::factory()->for($employee)->create([
        'account_id' => $data['account']->id,
        'daily_rate' => 1000,
        'effective_date' => '2025-01-01',
        'end_date' => null,
    ]);

    $response = $this->post(route('employees.salaries.store', $employee), [
        'daily_rate' => 1500,
        'effective_date' => '2025-06-01',
        'notes' => 'Annual increase',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('salaries', [
        'id' => $oldSalary->id,
    ]);
    expect($oldSalary->fresh()->end_date)->not->toBeNull();

    $this->assertDatabaseHas('salaries', [
        'employee_id' => $employee->id,
        'daily_rate' => 1500,
        'notes' => 'Annual increase',
        'end_date' => null,
    ]);

    expect($employee->fresh()->current_daily_rate)->toEqual(1500);
});

// ──────────────────────────────────────────────────
// Superadmin role tests (full account permissions)
// ──────────────────────────────────────────────────

test('superadmin can see all employees across account', function () {
    $data = actingAsAccountUser(['employees.view' => 'account']);

    Employee::factory()->for($data['account'])->create();
    Employee::factory()->for($data['account'])->create();
    Employee::factory()->for($data['account'])->create();

    $response = $this->get(route('employees.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('payroll/employees/index')
            ->has('employees.data', 4)
        );
});

test('superadmin can delete employee', function () {
    $data = actingAsAccountUser(['employees.delete' => 'account']);
    $employee = Employee::factory()->for($data['account'])->create();

    $response = $this->delete(route('employees.destroy', $employee));

    $response->assertRedirect(route('employees.index'))
        ->assertSessionHas('flash.success');

    $this->assertSoftDeleted('employees', ['id' => $employee->id]);
});

test('superadmin can rehire inactive employee', function () {
    $data = actingAsAccountUser(['employees.rehire' => 'account']);
    $employee = Employee::factory()->inactive()->for($data['account'])->create([
        'current_daily_rate' => 800,
        'end_date' => now()->subMonth(),
    ]);
    $oldSalary = Salary::factory()->for($employee)->create([
        'account_id' => $data['account']->id,
        'daily_rate' => 800,
        'effective_date' => '2024-01-01',
        'end_date' => null,
    ]);

    $response = $this->post(route('employees.rehire', $employee), [
        'daily_rate' => 1200,
        'rehire_date' => '2025-06-01',
    ]);

    $response->assertRedirect()
        ->assertSessionHas('flash.success');

    $employee->refresh();

    expect($employee->status)->toBe('active');
    expect($employee->end_date)->toBeNull();
    expect($employee->current_daily_rate)->toEqual(1200);

    expect($oldSalary->fresh()->end_date)->not->toBeNull();

    $this->assertDatabaseHas('salaries', [
        'employee_id' => $employee->id,
        'daily_rate' => 1200,
        'end_date' => null,
    ]);
});

// ──────────────────────────────────────────────────
// Search and filter tests
// ──────────────────────────────────────────────────

test('employees index can search by name', function () {
    $data = actingAsAccountUser(['employees.view' => 'account']);

    Employee::factory()->for($data['account'])->create(['first_name' => 'Alice', 'last_name' => 'Johnson']);
    Employee::factory()->for($data['account'])->create(['first_name' => 'Bob', 'last_name' => 'Williams']);
    Employee::factory()->for($data['account'])->create(['first_name' => 'Charlie', 'last_name' => 'Brown']);

    $response = $this->get(route('employees.index', ['search' => 'Alice']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('employees.data', 1)
            ->where('employees.data.0.first_name', 'Alice')
        );
});

test('employees index can search by employee number', function () {
    $data = actingAsAccountUser(['employees.view' => 'account']);

    Employee::factory()->for($data['account'])->create(['first_name' => 'Alice', 'employee_number' => 'EMP-'.now()->year.'-0099']);

    $response = $this->get(route('employees.index', ['search' => 'EMP-'.now()->year.'-0099']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('employees.data', 1)
        );
});

test('employees index can filter by status', function () {
    $data = actingAsAccountUser(['employees.view' => 'account']);

    Employee::factory()->for($data['account'])->create(['status' => 'active']);
    Employee::factory()->for($data['account'])->create(['status' => 'active']);
    Employee::factory()->inactive()->for($data['account'])->create();

    $response = $this->get(route('employees.index', ['status' => 'inactive']));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('employees.data', 1)
            ->where('employees.data.0.status', 'inactive')
        );
});

test('employees index can filter by role_id', function () {
    $data = actingAsAccountUser(['employees.view' => 'account']);

    $roleA = Role::factory()->for($data['account'])->create();
    $roleB = Role::factory()->for($data['account'])->create();

    Employee::factory()->for($data['account'])->withRole($roleA)->create();
    Employee::factory()->for($data['account'])->withRole($roleB)->create();

    $response = $this->get(route('employees.index', ['role_id' => $roleB->id]));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('employees.data', 1)
        );
});

// ──────────────────────────────────────────────────
// Validation tests
// ──────────────────────────────────────────────────

test('store employee validates required fields', function () {
    actingAsAccountUser(['employees.create' => 'account']);

    $response = $this->post(route('employees.store'), []);

    $response->assertSessionHasErrors([
        'first_name',
        'last_name',
        'position',
        'hire_date',
        'current_daily_rate',
        'email',
        'password',
    ]);
});

test('store employee validates email format', function () {
    $data = actingAsAccountUser(['employees.create' => 'account']);

    $response = $this->post(route('employees.store'), [
        'first_name' => 'Test',
        'last_name' => 'User',
        'position' => 'regular',
        'hire_date' => '2025-01-01',
        'current_daily_rate' => 1000,
        'email' => 'not-an-email',
        'password' => 'password123',
    ]);

    $response->assertSessionHasErrors('email');
});

test('store employee validates minimum password length', function () {
    $data = actingAsAccountUser(['employees.create' => 'account']);

    $response = $this->post(route('employees.store'), [
        'first_name' => 'Test',
        'last_name' => 'User',
        'position' => 'regular',
        'hire_date' => '2025-01-01',
        'current_daily_rate' => 1000,
        'email' => 'test@example.com',
        'password' => 'short',
    ]);

    $response->assertSessionHasErrors('password');
});

test('update employee validates required fields', function () {
    $data = actingAsAccountUser(['employees.edit' => 'account']);
    $employee = Employee::factory()->for($data['account'])->create();
    User::factory()->create(['employee_id' => $employee->id]);

    $response = $this->put(route('employees.update', $employee), [
        'first_name' => '',
        'last_name' => '',
    ]);

    $response->assertSessionHasErrors(['first_name', 'last_name']);
});

test('update employee accepts nullable fields', function () {
    $data = actingAsAccountUser(['employees.edit' => 'account']);
    $employee = Employee::factory()->for($data['account'])->create([
        'phone' => '09123456789',
        'address' => '123 Old St',
        'sss_number' => 'OLD-SSS',
    ]);
    User::factory()->create(['employee_id' => $employee->id]);

    $response = $this->put(route('employees.update', $employee), [
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'middle_name' => null,
        'phone' => null,
        'address' => null,
        'sss_number' => null,
        'philhealth_number' => null,
        'pagibig_number' => null,
        'tin_number' => null,
    ]);

    $response->assertRedirect();

    $employee->refresh();

    expect($employee->phone)->toBeNull();
    expect($employee->address)->toBeNull();
    expect($employee->sss_number)->toBeNull();
    expect($employee->philhealth_number)->toBeNull();
    expect($employee->pagibig_number)->toBeNull();
    expect($employee->tin_number)->toBeNull();
});

// ──────────────────────────────────────────────────
// Additional edge case tests
// ──────────────────────────────────────────────────

test('create page returns correct inertia component', function () {
    actingAsAccountUser(['employees.create' => 'account']);

    $response = $this->get(route('employees.create'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('payroll/employees/create')
        );
});

test('edit page returns correct inertia component', function () {
    $data = actingAsAccountUser(['employees.edit' => 'account']);
    $employee = Employee::factory()->for($data['account'])->create();

    $response = $this->get(route('employees.edit', $employee));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('payroll/employees/edit')
            ->has('employee')
        );
});

test('employee number format is correct', function () {
    $data = actingAsAccountUser(['employees.create' => 'account']);

    $this->post(route('employees.store'), [
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'position' => 'regular',
        'hire_date' => '2025-01-15',
        'current_daily_rate' => 1000,
        'email' => 'jane.doe@example.com',
        'password' => 'password123',
    ]);

    $employee = Employee::where('first_name', 'Jane')->first();
    $pattern = '/^EMP-'.now()->year.'-\d{4}$/';
    expect($employee->employee_number)->toMatch($pattern);
    expect($employee->username)->toBe($employee->employee_number);
});

test('admin cannot see employees from other accounts', function () {
    $data = actingAsAccountUser(['employees.view' => 'account']);
    $otherAccount = Account::factory()->create();

    Employee::factory()->for($data['account'])->create();
    Employee::factory()->for($otherAccount)->create();

    $response = $this->get(route('employees.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('employees.data', 2)
        );
});

test('staff cannot see other employees in index', function () {
    $data = actingAsAccountUser(['employees.view' => 'self']);

    Employee::factory()->count(3)->for($data['account'])->create();

    $response = $this->get(route('employees.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('employees.data', 1)
            ->where('employees.data.0.id', $data['employee']->id)
        );
});
