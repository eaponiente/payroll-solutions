<?php

namespace App\Http\Controllers\Payroll;

use App\Context\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\DeMinimisBenefit;
use App\Models\DeMinimisBenefitEntry;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DeMinimisController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('admin.manage_config');

        $accountId = TenantContext::id();

        $benefits = DeMinimisBenefit::where('account_id', $accountId)
            ->orderBy('name')
            ->get();

        $entries = DeMinimisBenefitEntry::where('account_id', $accountId)
            ->with(['employee', 'benefit'])
            ->when($request->employee_id, fn ($q, $id) => $q->where('employee_id', $id))
            ->latest('date')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/deminimis/index', compact('benefits', 'entries'));
    }

    public function storeTemplate(Request $request): RedirectResponse
    {
        Gate::authorize('admin.manage_config');

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'default_amount' => 'required|numeric|min:0',
            'frequency' => 'required|string|in:monthly,annual',
        ]);

        DeMinimisBenefit::create([
            'account_id' => TenantContext::id(),
            ...$validated,
        ]);

        return back()->with('flash.success', 'Benefit template created.');
    }

    public function updateTemplate(Request $request, DeMinimisBenefit $benefit): RedirectResponse
    {
        Gate::authorize('admin.manage_config');

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'default_amount' => 'required|numeric|min:0',
            'frequency' => 'required|string|in:monthly,annual',
            'is_active' => 'boolean',
        ]);

        $benefit->update($validated);

        return back()->with('flash.success', 'Benefit template updated.');
    }

    public function store(Request $request, Employee $employee): RedirectResponse
    {
        Gate::authorize('employees.edit', $employee);

        $validated = $request->validate([
            'deminimis_benefit_id' => 'required|exists:de_minimis_benefits,id',
            'amount' => 'required|numeric|min:0.01',
            'date' => 'required|date',
        ]);

        DeMinimisBenefitEntry::create([
            'account_id' => TenantContext::id(),
            'employee_id' => $employee->id,
            ...$validated,
        ]);

        return back()->with('flash.success', 'De minimis benefit recorded.');
    }

    public function destroy(DeMinimisBenefitEntry $entry): RedirectResponse
    {
        Gate::authorize('employees.edit', $entry->employee);

        if ($entry->payroll_period_id) {
            return back()->with('flash.error', 'Cannot delete a benefit already included in a payroll period.');
        }

        $entry->delete();

        return back()->with('flash.success', 'De minimis benefit removed.');
    }
}
