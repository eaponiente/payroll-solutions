<?php

namespace App\Http\Controllers\Attendance;

use App\Context\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\OvertimeRequest;
use App\Services\OvertimeCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class OvertimeController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('overtime.submit');

        $requests = OvertimeRequest::with(['employee', 'approver'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->employee_id, fn ($q, $e) => $q->where('employee_id', $e))
            ->latest()->paginate(config('company.pagination_per_page'));

        return Inertia::render('attendance/overtime/index', compact('requests'));
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('overtime.submit');

        $validated = $request->validate([
            'date' => 'required|date',
            'requested_minutes' => 'required|integer|min:1',
            'reason' => 'required|string',
            'shift_type' => 'required|string|in:regular_day,rest_day,regular_holiday,special_holiday',
        ]);

        $user = auth()->user();
        $employee = $user->employee;

        OvertimeRequest::create([
            ...$validated,
            'employee_id' => $employee->id,
            'account_id' => TenantContext::id(),
            'status' => 'pending',
        ]);

        return back()->with('flash.success', 'Overtime request submitted.');
    }

    public function approve(OvertimeRequest $overtime): RedirectResponse
    {
        Gate::authorize('overtime.approve', $overtime->employee);

        $approver = auth()->user()->employee;

        $multiplier = OvertimeCalculator::multiplier($overtime->shift_type);

        $overtime->update([
            'status' => 'approved',
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'multiplier' => $multiplier,
        ]);

        return back()->with('flash.success', 'Overtime approved.');
    }

    public function deny(Request $request, OvertimeRequest $overtime): RedirectResponse
    {
        Gate::authorize('overtime.approve', $overtime->employee);

        $approver = auth()->user()->employee;

        $validated = $request->validate([
            'denial_reason' => 'required|string',
        ]);

        $overtime->update([
            'status' => 'denied',
            'denial_reason' => $validated['denial_reason'],
        ]);

        return back()->with('flash.success', 'Overtime denied.');
    }
}
