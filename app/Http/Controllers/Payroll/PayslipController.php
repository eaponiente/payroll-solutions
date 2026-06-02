<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\PayrollPeriodItem;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PayslipController extends Controller
{
    public function show(Employee $employee): Response
    {
        Gate::authorize('payslips.view', $employee);

        $items = PayrollPeriodItem::with('payrollPeriod')
            ->where('employee_id', $employee->id)
            ->latest()
            ->paginate(config('company.pagination_per_page'));

        return Inertia::render('payroll/payslips/show', compact('employee', 'items'));
    }
}
