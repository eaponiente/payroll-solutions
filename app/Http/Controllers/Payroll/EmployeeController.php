<?php

namespace App\Http\Controllers\Payroll;

use App\Context\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\DeMinimisBenefit;
use App\Models\Employee;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('employees.view');

        $employees = $this->getScopedQuery()
            ->when($request->search, fn ($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                    ->orWhere('last_name', 'like', "%{$s}%")
                    ->orWhere('employee_number', 'like', "%{$s}%");
            }))
            ->when($request->first_name, fn ($q, $v) => $q->where('first_name', 'like', "%{$v}%"))
            ->when($request->last_name, fn ($q, $v) => $q->where('last_name', 'like', "%{$v}%"))
            ->when($request->location, fn ($q, $v) => $q->where('location', 'like', "%{$v}%"))
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->role_id, fn ($q, $r) => $q->where('role_id', $r))
            ->when($request->role, fn ($q, $r) => $q->whereHas('role', fn ($q) => $q->where('slug', $r)))
            ->with('role')
            ->paginate(config('company.pagination_per_page'))
            ->withQueryString();

        return Inertia::render('payroll/employees/index', compact('employees'));
    }

    public function show(Employee $employee): Response
    {
        Gate::authorize('employees.view', $employee);

        $employee->load(['role', 'salaries' => fn ($q) => $q->latest('effective_date'), 'schedules' => fn ($q) => $q->latest('effective_from'), 'shiftAssignments' => fn ($q) => $q->where('date', '>=', now()->toDateString())->orderBy('date')->with('shift'), 'user', 'retroactivePayments' => fn ($q) => $q->latest('created_at'), 'deminimisEntries' => fn ($q) => $q->latest('date')->with('benefit')]);

        $deminimisBenefits = DeMinimisBenefit::where('account_id', TenantContext::id())
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return Inertia::render('payroll/employees/show', compact('employee', 'deminimisBenefits'));
    }

    public function create(): Response
    {
        Gate::authorize('employees.create');

        $accountId = TenantContext::id();
        $roles = Role::where('account_id', $accountId)->orderBy('name')->get();

        return Inertia::render('payroll/employees/create', compact('roles'));
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('employees.create');

        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'sss_number' => 'nullable|string|max:20',
            'philhealth_number' => 'nullable|string|max:20',
            'pagibig_number' => 'nullable|string|max:20',
            'tin_number' => 'nullable|string|max:20',
            'position' => 'required|string|max:50',
            'hire_date' => 'required|date',
            'current_daily_rate' => 'required|numeric|min:0',
            'role_id' => 'nullable|exists:roles,id',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'schedule_start' => 'nullable|date_format:H:i',
            'schedule_end' => 'nullable|date_format:H:i',
            'rest_days' => 'nullable|array',
            'rest_days.*' => 'string|in:sunday,monday,tuesday,wednesday,thursday,friday,saturday',
        ]);

        DB::transaction(function () use ($validated) {
            $accountId = TenantContext::id();

            if (! empty($validated['role_id'])) {
                $roleId = $validated['role_id'];
            } else {
                $defaultRole = Role::firstOrCreate(
                    ['account_id' => $accountId, 'slug' => 'employee'],
                    ['name' => 'Employee', 'is_default' => true]
                );
                $roleId = $defaultRole->id;
            }

            $employeeNumber = $this->generateEmployeeNumber();
            $employee = Employee::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'location' => $validated['location'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'sss_number' => $validated['sss_number'] ?? null,
                'philhealth_number' => $validated['philhealth_number'] ?? null,
                'pagibig_number' => $validated['pagibig_number'] ?? null,
                'tin_number' => $validated['tin_number'] ?? null,
                'position' => $validated['position'],
                'hire_date' => $validated['hire_date'],
                'current_daily_rate' => $validated['current_daily_rate'],
                'account_id' => $accountId,
                'role_id' => $roleId,
                'employee_number' => $employeeNumber,
                'username' => $employeeNumber,
                'status' => 'active',
            ]);

            if (! empty($validated['schedule_start'])) {
                $employee->schedules()->create([
                    'account_id' => $accountId,
                    'schedule_start' => $validated['schedule_start'],
                    'schedule_end' => $validated['schedule_end'] ?? '17:00',
                    'rest_days' => $validated['rest_days'] ?? ['sunday'],
                    'effective_from' => now()->toDateString(),
                ]);
            }

            User::create([
                'employee_id' => $employee->id,
                'name' => $employee->first_name.' '.$employee->last_name,
                'email' => $validated['email'],
                'password' => $validated['password'],
                'is_enabled' => true,
            ]);
        });

        return to_route('employees.index')->with('flash.success', 'Employee created.');
    }

    public function edit(Employee $employee): Response
    {
        Gate::authorize('employees.edit', $employee);

        $accountId = TenantContext::id();
        $roles = Role::where('account_id', $accountId)->orderBy('name')->get();
        $employee->load('user');

        return Inertia::render('payroll/employees/edit', compact('employee', 'roles'));
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        Gate::authorize('employees.edit', $employee);

        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'middle_name' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'sss_number' => 'nullable|string|max:20',
            'philhealth_number' => 'nullable|string|max:20',
            'pagibig_number' => 'nullable|string|max:20',
            'tin_number' => 'nullable|string|max:20',
            'position' => 'nullable|string|max:50',
            'hire_date' => 'nullable|date',
            'current_daily_rate' => 'nullable|numeric|min:0',
            'role_id' => 'nullable|exists:roles,id',
        ]);

        $employee->update($validated);

        if ($employee->user) {
            $employee->user->update([
                'name' => $employee->first_name.' '.$employee->last_name,
            ]);

            if ($request->filled('email')) {
                $request->validate(['email' => 'required|email|unique:users,email,'.$employee->user->id]);
                $employee->user->update(['email' => $request->email]);
            }

            if ($request->filled('password')) {
                $request->validate(['password' => 'required|string|min:8']);
                $employee->user->update(['password' => bcrypt($request->password)]);
            }
        }

        return back()->with('flash.success', 'Employee updated.');
    }

    public function destroy(Employee $employee): RedirectResponse
    {
        Gate::authorize('employees.delete', $employee);

        $employee->delete();

        return to_route('employees.index')->with('flash.success', 'Employee deactivated.');
    }

    public function rehire(Request $request, Employee $employee): RedirectResponse
    {
        Gate::authorize('employees.rehire', $employee);

        $validated = $request->validate([
            'daily_rate' => 'required|numeric|min:0',
            'rehire_date' => 'required|date',
        ]);

        $employee->update([
            'status' => 'active',
            'end_date' => null,
        ]);

        $employee->salaries()->whereNull('end_date')->update(['end_date' => now()]);
        $employee->salaries()->create([
            'account_id' => TenantContext::id(),
            'daily_rate' => $validated['daily_rate'],
            'effective_date' => $validated['rehire_date'],
        ]);
        $employee->update(['current_daily_rate' => $validated['daily_rate']]);

        return back()->with('flash.success', 'Employee rehired.');
    }

    public function salaries(Employee $employee): Response
    {
        Gate::authorize('employees.view', $employee);

        $salaries = $employee->salaries()->orderByDesc('effective_date')->get();

        return Inertia::render('payroll/employees/salaries', compact('employee', 'salaries'));
    }

    public function addSalary(Request $request, Employee $employee): RedirectResponse
    {
        Gate::authorize('employees.edit', $employee);

        $validated = $request->validate([
            'daily_rate' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($employee, $validated) {
            $employee->salaries()->whereNull('end_date')->update(['end_date' => now()->subDay()]);
            $employee->salaries()->create([
                ...$validated,
                'account_id' => TenantContext::id(),
            ]);
            $employee->update(['current_daily_rate' => $validated['daily_rate']]);
        });

        return back()->with('flash.success', 'Salary updated.');
    }

    private function getScopedQuery()
    {
        $user = auth()->user();
        if (! $user || ! $user->employee) {
            return Employee::query();
        }

        $employee = $user->employee;

        $permission = $employee->role?->permissions()->where('slug', 'employees.view')->first();
        $scope = $permission?->pivot?->scope;

        if ($scope === 'account') {
            return Employee::query();
        }

        return Employee::where('id', $employee->id);
    }

    private function generateEmployeeNumber(): string
    {
        $year = now()->year;
        $latest = Employee::withTrashed()
            ->where('employee_number', 'like', "EMP-{$year}-%")
            ->orderByDesc('employee_number')
            ->first();

        $sequence = $latest ? (int) substr($latest->employee_number, -4) + 1 : 1;

        return sprintf('EMP-%s-%04d', $year, $sequence);
    }
}
