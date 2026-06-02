<?php

namespace App\Http\Controllers\Payroll;

use App\Context\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ScheduleController extends Controller
{
    public function store(Request $request, Employee $employee): RedirectResponse
    {
        Gate::authorize('employees.edit', $employee);

        $validated = $request->validate([
            'schedule_start' => 'required|date_format:H:i',
            'schedule_end' => 'required|date_format:H:i',
            'rest_days' => 'required|array|min:0',
            'rest_days.*' => 'string|in:sunday,monday,tuesday,wednesday,thursday,friday,saturday',
            'effective_from' => 'required|date',
        ]);

        $employee->schedules()->whereNull('effective_to')->update([
            'effective_to' => now()->subDay()->toDateString(),
        ]);

        EmployeeSchedule::create([
            'account_id' => TenantContext::id(),
            'employee_id' => $employee->id,
            'schedule_start' => $validated['schedule_start'],
            'schedule_end' => $validated['schedule_end'],
            'rest_days' => $validated['rest_days'],
            'effective_from' => $validated['effective_from'],
        ]);

        return back()->with('flash.success', 'Employee schedule updated.');
    }
}
