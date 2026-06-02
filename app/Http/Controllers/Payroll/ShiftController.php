<?php

namespace App\Http\Controllers\Payroll;

use App\Context\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    private function ensureShifting(): void
    {
        if (auth()->user()->employee->account->schedule_type !== 'shifting') {
            abort(403);
        }
    }

    public function index(): Response
    {
        $this->ensureShifting();
        Gate::authorize('viewAny', Shift::class);

        $accountId = TenantContext::id();
        $shifts = Shift::where('account_id', $accountId)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('payroll/shifts/index', compact('shifts'));
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensureShifting();
        Gate::authorize('create', Shift::class);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'night_differential' => 'boolean',
            'rest_days' => 'required|array',
            'rest_days.*' => 'string|in:sun,mon,tue,wed,thu,fri,sat',
        ]);

        Shift::create([
            'account_id' => TenantContext::id(),
            ...$validated,
        ]);

        return back()->with('flash.success', 'Shift created.');
    }

    public function update(Request $request, Shift $shift): RedirectResponse
    {
        $this->ensureShifting();
        Gate::authorize('update', $shift);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'night_differential' => 'boolean',
            'rest_days' => 'required|array',
            'rest_days.*' => 'string|in:sun,mon,tue,wed,thu,fri,sat',
        ]);

        $shift->update($validated);

        return back()->with('flash.success', 'Shift updated.');
    }

    public function destroy(Shift $shift): RedirectResponse
    {
        $this->ensureShifting();
        Gate::authorize('delete', $shift);

        $shift->delete();

        return back()->with('flash.success', 'Shift deleted.');
    }

    public function bulkAssign(Request $request): RedirectResponse
    {
        $this->ensureShifting();
        Gate::authorize('admin.manage_shifts');

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'shift_id' => 'required|exists:shifts,id',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'days' => 'required|array',
            'days.*' => 'string|in:sun,mon,tue,wed,thu,fri,sat',
        ]);

        $accountId = TenantContext::id();
        $dateFrom = Carbon::parse($validated['date_from']);
        $dateTo = Carbon::parse($validated['date_to']);
        $days = array_map('strtolower', $validated['days']);

        $current = $dateFrom->copy();
        while ($current->lte($dateTo)) {
            if (in_array(strtolower($current->format('D')), $days)) {
                EmployeeShiftAssignment::updateOrCreate(
                    [
                        'employee_id' => $validated['employee_id'],
                        'date' => $current->toDateString(),
                    ],
                    [
                        'account_id' => $accountId,
                        'shift_id' => $validated['shift_id'],
                    ]
                );
            }
            $current->addDay();
        }

        return to_route('shifts.roster')->with('flash.success', 'Shift assignments saved.');
    }

    public function assignDate(Request $request, Employee $employee): RedirectResponse
    {
        $this->ensureShifting();
        Gate::authorize('admin.manage_shifts');

        $validated = $request->validate([
            'shift_id' => 'required|exists:shifts,id',
            'date' => 'required|date',
        ]);

        EmployeeShiftAssignment::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'date' => $validated['date'],
            ],
            [
                'account_id' => TenantContext::id(),
                'shift_id' => $validated['shift_id'],
            ]
        );

        return to_route('shifts.roster')->with('flash.success', 'Shift assigned for date.');
    }

    public function unassignDate(Request $request, Employee $employee): RedirectResponse
    {
        $this->ensureShifting();
        Gate::authorize('admin.manage_shifts');

        $validated = $request->validate([
            'date' => 'required|date',
        ]);

        EmployeeShiftAssignment::where('employee_id', $employee->id)
            ->whereDate('date', $validated['date'])
            ->delete();

        return to_route('shifts.roster')->with('flash.success', 'Shift unassigned for date.');
    }

    public function roster(Request $request): Response
    {
        $this->ensureShifting();
        Gate::authorize('admin.manage_shifts');

        $accountId = TenantContext::id();

        $dateFrom = $request->has('date_from')
            ? Carbon::parse($request->date_from)
            : Carbon::now()->startOfWeek(Carbon::MONDAY);

        $dateTo = $request->has('date_to')
            ? Carbon::parse($request->date_to)
            : Carbon::now()->endOfWeek(Carbon::SUNDAY);

        $employees = Employee::where('account_id', $accountId)
            ->where('status', 'active')
            ->when($request->employee_id, fn ($q, $id) => $q->where('id', $id))
            ->orderBy('last_name')
            ->get();

        $shifts = Shift::where('account_id', $accountId)
            ->orderBy('sort_order')
            ->get();

        $assignments = EmployeeShiftAssignment::where('account_id', $accountId)
            ->whereBetween('date', [$dateFrom->toDateString(), $dateTo->toDateString()])
            ->with('shift')
            ->get();

        $dateRange = [
            'from' => $dateFrom->toDateString(),
            'to' => $dateTo->toDateString(),
        ];

        return Inertia::render('payroll/shifts/roster', compact('employees', 'shifts', 'assignments', 'dateRange'));
    }
}
