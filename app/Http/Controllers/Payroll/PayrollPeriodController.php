<?php

namespace App\Http\Controllers\Payroll;

use App\Context\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\PayrollPeriod;
use App\Services\PayrollPeriodService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PayrollPeriodController extends Controller
{
    public function __construct(
        private PayrollPeriodService $payrollPeriodService,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('payroll.view');

        $periods = PayrollPeriod::with(['approver'])
            ->latest('period_start')
            ->paginate(config('company.pagination_per_page'));

        return Inertia::render('payroll/periods/index', compact('periods'));
    }

    public function generate(Request $request): RedirectResponse
    {
        Gate::authorize('payroll.generate');

        $validated = $request->validate([
            'period_start' => 'required|date',
            'period_end' => 'required|date|after:period_start',
        ]);

        $period = $this->payrollPeriodService->generate(
            $validated['period_start'],
            $validated['period_end'],
            TenantContext::id(),
            auth()->user()->employee->id,
        );

        return to_route('payroll.periods.show', $period)
            ->with('flash.success', 'Payroll period generated.');
    }

    public function show(PayrollPeriod $period): Response
    {
        Gate::authorize('payroll.view');

        $period->load(['items.employee', 'approver']);

        return Inertia::render('payroll/periods/show', compact('period'));
    }

    public function approve(PayrollPeriod $period): RedirectResponse
    {
        Gate::authorize('payroll.approve');

        $approver = auth()->user()->employee;
        $this->payrollPeriodService->approve($period, $approver->id);

        return back()->with('flash.success', 'Payroll period approved.');
    }

    public function void(PayrollPeriod $period): RedirectResponse
    {
        Gate::authorize('payroll.void');

        $this->payrollPeriodService->void($period);

        return back()->with('flash.success', 'Payroll period voided.');
    }

    public function print(PayrollPeriod $period): Response
    {
        Gate::authorize('payroll.view');

        $period->load(['items.employee']);

        return Inertia::render('payroll/periods/print', compact('period'));
    }
}
