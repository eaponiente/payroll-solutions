<?php

namespace App\Http\Controllers\Attendance;

use App\Context\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\CashAdvance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CashAdvanceController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('cash_advances.submit');

        $advances = CashAdvance::with(['employee', 'approver'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->latest()->paginate(config('company.pagination_per_page'));

        return Inertia::render('attendance/cash-advances/index', compact('advances'));
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('cash_advances.submit');

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string',
        ]);

        $user = auth()->user();
        $employee = $user->employee;

        // Check existing active CA
        $existing = CashAdvance::where('employee_id', $employee->id)
            ->where('remaining_balance', '>', 0)
            ->exists();

        if ($existing) {
            return back()->with('flash.error', 'You have an existing cash advance balance. Settle it before requesting a new one.');
        }

        // Check against projected receivable
        $maxCA = $this->computeMaxReceivable($employee);

        if ($validated['amount'] > $maxCA) {
            return back()->with('flash.error', 'Requested amount exceeds maximum receivable of ₱'.number_format($maxCA, 2));
        }

        CashAdvance::create([
            'account_id' => TenantContext::id(),
            'employee_id' => $employee->id,
            'amount' => $validated['amount'],
            'remaining_balance' => $validated['amount'],
            'reason' => $validated['reason'],
            'status' => 'pending',
            'requested_by' => $employee->id,
        ]);

        return back()->with('flash.success', 'Cash advance request submitted.');
    }

    public function approve(CashAdvance $cashAdvance): RedirectResponse
    {
        Gate::authorize('cash_advances.approve', $cashAdvance->employee);

        $approver = auth()->user()->employee;

        $cashAdvance->update([
            'status' => 'approved',
            'approved_by' => $approver->id,
            'approved_at' => now(),
        ]);

        return back()->with('flash.success', 'Cash advance approved.');
    }

    public function deny(Request $request, CashAdvance $cashAdvance): RedirectResponse
    {
        Gate::authorize('cash_advances.approve', $cashAdvance->employee);

        $approver = auth()->user()->employee;

        $validated = $request->validate([
            'denial_reason' => 'required|string',
        ]);

        $cashAdvance->update([
            'status' => 'denied',
            'denial_reason' => $validated['denial_reason'],
        ]);

        return back()->with('flash.success', 'Cash advance denied.');
    }

    private function computeMaxReceivable($employee): float
    {
        $dailyRate = (float) $employee->current_daily_rate;
        $weeklyPay = $dailyRate * 6;

        return $weeklyPay * (config('company.ca_max_percent_of_receivable') / 100);
    }
}
