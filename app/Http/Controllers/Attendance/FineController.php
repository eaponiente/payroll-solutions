<?php

namespace App\Http\Controllers\Attendance;

use App\Context\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Fine;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class FineController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('fines.view');

        $fines = Fine::with(['employee', 'marker'])
            ->when($request->employee_id, fn ($q, $e) => $q->where('employee_id', $e))
            ->when($request->fine_type, fn ($q, $t) => $q->where('fine_type', $t))
            ->latest('date')
            ->paginate(config('company.pagination_per_page'));

        return Inertia::render('attendance/fines/index', compact('fines'));
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('fines.create');

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date' => 'required|date',
            'fine_type' => 'required|string|max:50',
            'amount' => 'required|numeric|min:0',
            'reason' => 'required|string',
        ]);

        $marker = auth()->user()->employee;
        $employee = Employee::findOrFail($validated['employee_id']);

        Fine::create([
            ...$validated,
            'account_id' => TenantContext::id(),
            'marked_by' => $marker->id,
        ]);

        return back()->with('flash.success', 'Fine recorded.');
    }
}
