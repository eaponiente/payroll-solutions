<?php

namespace App\Http\Controllers\Payroll;

use App\Context\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\RetroactivePayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class RetroactivePaymentController extends Controller
{
    public function store(Request $request, Employee $employee): RedirectResponse
    {
        Gate::authorize('employees.edit', $employee);

        $validated = $request->validate([
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'effective_from' => 'required|date',
            'effective_to' => 'required|date|after_or_equal:effective_from',
        ]);

        RetroactivePayment::create([
            'account_id' => TenantContext::id(),
            'employee_id' => $employee->id,
            ...$validated,
        ]);

        return back()->with('flash.success', 'Retroactive payment recorded.');
    }

    public function destroy(RetroactivePayment $retroactive): RedirectResponse
    {
        Gate::authorize('employees.edit', $retroactive->employee);

        if ($retroactive->paid_at) {
            return back()->with('flash.error', 'Cannot delete a paid retroactive payment.');
        }

        $retroactive->delete();

        return back()->with('flash.success', 'Retroactive payment removed.');
    }
}
