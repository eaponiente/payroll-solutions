<?php

use App\Models\Account;
use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\PayrollPeriodItem;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\PayrollPeriodService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function actingAsPeriodStaff(): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

function actingAsPeriodAdmin(array $permissions = []): array
{
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();

    foreach ($permissions as $slug => $scope) {
        $perm = Permission::firstOrCreate(['slug' => $slug], [
            'name' => $slug,
            'group' => 'payroll',
        ]);
        $role->permissions()->attach($perm->id, ['scope' => $scope]);
    }

    $employee = Employee::factory()->for($account)->withRole($role)->create();
    $user = User::factory()->create(['employee_id' => $employee->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'employee', 'user');
}

test('guest cannot access payroll periods', function () {
    $this->get(route('payroll.periods.index'))->assertRedirect(route('login'));
    $this->post(route('payroll.periods.generate'))->assertRedirect(route('login'));
});

test('staff cannot view periods index', function () {
    actingAsPeriodStaff();

    $this->get(route('payroll.periods.index'))
        ->assertStatus(403);
});

test('admin can view periods index', function () {
    $data = actingAsPeriodAdmin(['payroll.view' => 'account']);

    PayrollPeriod::factory()->create([
        'account_id' => $data['account']->id,
        'period_start' => now()->startOfMonth(),
        'period_end' => now()->endOfMonth(),
        'status' => 'draft',
    ]);

    $this->get(route('payroll.periods.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('payroll/periods/index')
            ->has('periods.data'),
        );
});

test('admin can generate payroll period', function () {
    $data = actingAsPeriodAdmin(['payroll.generate' => 'account']);

    $period = PayrollPeriod::factory()->create([
        'account_id' => $data['account']->id,
        'period_start' => now()->startOfMonth(),
        'period_end' => now()->endOfMonth(),
        'status' => 'draft',
    ]);

    $this->mock(PayrollPeriodService::class, function ($mock) use ($period) {
        $mock->shouldReceive('generate')
            ->once()
            ->andReturn($period);
    });

    $this->post(route('payroll.periods.generate'), [
        'period_start' => now()->startOfMonth()->toDateString(),
        'period_end' => now()->endOfMonth()->toDateString(),
    ])
        ->assertRedirect(route('payroll.periods.show', $period))
        ->assertSessionHas('flash.success');
});

test('generate validates required fields', function () {
    $data = actingAsPeriodAdmin(['payroll.generate' => 'account']);

    $this->post(route('payroll.periods.generate'), [])
        ->assertSessionHasErrors(['period_start', 'period_end']);
});

test('generate validates period_end after period_start', function () {
    $data = actingAsPeriodAdmin(['payroll.generate' => 'account']);

    $this->post(route('payroll.periods.generate'), [
        'period_start' => now()->endOfMonth()->toDateString(),
        'period_end' => now()->startOfMonth()->toDateString(),
    ])
        ->assertSessionHasErrors('period_end');
});

test('admin can view period detail', function () {
    $data = actingAsPeriodAdmin(['payroll.view' => 'account']);

    $period = PayrollPeriod::factory()->create([
        'account_id' => $data['account']->id,
        'period_start' => now()->startOfMonth(),
        'period_end' => now()->endOfMonth(),
        'status' => 'draft',
    ]);

    $staffEmployee = Employee::factory()->for($data['account'])->create();
    PayrollPeriodItem::factory()->for($period)->for($staffEmployee)->create([
        'account_id' => $data['account']->id,
    ]);

    $this->get(route('payroll.periods.show', $period))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('payroll/periods/show')
            ->has('period')
            ->has('period.items')
            ->has('period.approver'),
        );
});

test('admin can approve draft period', function () {
    $data = actingAsPeriodAdmin(['payroll.approve' => 'account']);

    $period = PayrollPeriod::factory()->create([
        'account_id' => $data['account']->id,
        'period_start' => now()->startOfMonth(),
        'period_end' => now()->endOfMonth(),
        'status' => 'draft',
        'approved_by' => null,
        'approved_at' => null,
    ]);

    $this->mock(PayrollPeriodService::class, function ($mock) use ($period, $data) {
        $mock->shouldReceive('approve')
            ->once()
            ->withArgs(function ($p, $empId) use ($period, $data) {
                return $p->id === $period->id && $empId === $data['employee']->id;
            });
    });

    $this->post(route('payroll.periods.approve', $period))
        ->assertRedirect()
        ->assertSessionHas('flash.success');
});

test('admin can void draft period', function () {
    $data = actingAsPeriodAdmin(['payroll.void' => 'account']);

    $period = PayrollPeriod::factory()->create([
        'account_id' => $data['account']->id,
        'period_start' => now()->startOfMonth(),
        'period_end' => now()->endOfMonth(),
        'status' => 'draft',
    ]);

    $this->post(route('payroll.periods.void', $period))
        ->assertRedirect()
        ->assertSessionHas('flash.success');
});

test('periods index can filter by period dates', function () {
    $data = actingAsPeriodAdmin(['payroll.view' => 'account']);

    PayrollPeriod::factory()->create([
        'account_id' => $data['account']->id,
        'period_start' => '2025-01-01',
        'period_end' => '2025-01-15',
        'status' => 'draft',
    ]);
    PayrollPeriod::factory()->create([
        'account_id' => $data['account']->id,
        'period_start' => '2025-01-16',
        'period_end' => '2025-01-31',
        'status' => 'draft',
    ]);

    $this->get(route('payroll.periods.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('periods.data', 2),
        );
});

test('period show returns 404 for non-existent period', function () {
    $data = actingAsPeriodAdmin(['payroll.view' => 'account']);

    $this->get(route('payroll.periods.show', 99999))
        ->assertNotFound();
});
