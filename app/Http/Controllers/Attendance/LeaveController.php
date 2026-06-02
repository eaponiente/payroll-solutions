<?php

namespace App\Http\Controllers\Attendance;

use App\Context\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class LeaveController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('leaves.submit');

        $requests = LeaveRequest::with(['employee', 'approver'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->latest()->paginate(config('company.pagination_per_page'));

        return Inertia::render('attendance/leaves/index', compact('requests'));
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('leaves.submit');

        $validated = $request->validate([
            'date' => 'required|date',
            'leave_type' => 'required|string|in:vacation,sick,emergency,maternity,paternity,bereavement,unpaid',
            'duration' => 'required|string|in:full_day,half_day_am,half_day_pm',
            'reason' => 'required|string',
        ]);

        $user = auth()->user();
        $employee = $user->employee;

        $isPaid = $validated['leave_type'] !== 'unpaid';

        if ($isPaid && $employee->leaves_used_this_year >= config('company.paid_leaves_per_year')) {
            return back()->with('flash.warning', 'You have used all 5 paid leaves. This will be filed as unpaid leave unless overridden by admin.');
        }

        LeaveRequest::create([
            ...$validated,
            'account_id' => TenantContext::id(),
            'employee_id' => $employee->id,
            'is_paid' => $isPaid,
            'status' => 'pending',
        ]);

        return back()->with('flash.success', 'Leave request submitted.');
    }

    public function approve(LeaveRequest $leave): RedirectResponse
    {
        Gate::authorize('leaves.approve', $leave->employee);

        $approver = auth()->user()->employee;

        $leave->update([
            'status' => 'approved',
            'approved_by' => $approver->id,
            'approved_at' => now(),
        ]);

        // Increment leave count for paid leaves
        $leaveEmployee = $leave->employee;
        if ($leave->is_paid) {
            $leaveEmployee->increment('leaves_used_this_year');
        }

        return back()->with('flash.success', 'Leave approved.');
    }

    public function deny(Request $request, LeaveRequest $leave): RedirectResponse
    {
        Gate::authorize('leaves.approve', $leave->employee);

        $approver = auth()->user()->employee;

        $validated = $request->validate([
            'denial_reason' => 'required|string',
        ]);

        $leave->update([
            'status' => 'denied',
            'denial_reason' => $validated['denial_reason'],
        ]);

        return back()->with('flash.success', 'Leave denied.');
    }
}
