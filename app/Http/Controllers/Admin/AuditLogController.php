<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('admin.manage_roles');

        $logs = AuditLog::with(['employee', 'user', 'account'])
            ->when($request->model_type, fn ($q, $t) => $q->where('model_type', 'like', "%{$t}%"))
            ->when($request->action, fn ($q, $a) => $q->where('action', $a))
            ->when($request->employee_id, fn ($q, $e) => $q->where('employee_id', $e))
            ->latest('created_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('admin/audit/index', [
            'logs' => $logs,
            'filters' => $request->only(['model_type', 'action', 'employee_id']),
        ]);
    }
}
