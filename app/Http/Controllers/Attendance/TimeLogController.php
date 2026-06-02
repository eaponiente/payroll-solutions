<?php

namespace App\Http\Controllers\Attendance;

use App\Context\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\AttendanceSheet;
use App\Models\Employee;
use App\Models\TimeLog;
use App\Services\AttendanceService;
use App\Services\AuditService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class TimeLogController extends Controller
{
    public function __construct(
        private AttendanceService $attendanceService,
        private AuditService $auditService,
    ) {}

    public function punch(Request $request): RedirectResponse
    {
        Gate::authorize('attendance.punch');

        $user = auth()->user();
        $employee = $user->employee;

        if (! $employee || ! $employee->isActive()) {
            return back()->with('flash.error', 'Cannot punch. Employee record not found.');
        }

        $validated = $request->validate([
            'type' => 'required|string|in:in,out,lunch_out,lunch_in',
        ]);

        $type = $validated['type'];
        $now = now();

        // Duplicate detection within 5 minutes
        $existing = TimeLog::where('employee_id', $employee->id)
            ->where('type', $type)
            ->where('punched_at', '>=', $now->copy()->subMinutes(5))
            ->first();

        if ($existing) {
            TimeLog::create([
                'account_id' => TenantContext::id(),
                'employee_id' => $employee->id,
                'type' => $type,
                'source' => 'self_service',
                'punched_at' => $now,
                'duplicate_of' => $existing->id,
            ]);
        } else {
            TimeLog::create([
                'account_id' => TenantContext::id(),
                'employee_id' => $employee->id,
                'type' => $type,
                'source' => 'self_service',
                'punched_at' => $now,
            ]);
        }

        // Process attendance asynchronously (or synchronously for now)
        if ($type === 'out') {
            $tz = $employee->account->timezone ?? 'UTC';
            $this->attendanceService->processDailyAttendance($employee, $now->copy()->setTimezone($tz)->toDateString());
        }

        return back()->with('flash.success', ucfirst(str_replace('_', ' ', $type)).' recorded.');
    }

    public function myAttendance(Request $request): Response
    {
        Gate::authorize('attendance.view_own');

        $user = auth()->user();
        $employee = $user->employee;

        if (! $employee) {
            return redirect()->route('employees.create')
                ->with('flash.warning', 'Please complete your employee profile.');
        }

        $sheets = AttendanceSheet::where('employee_id', $employee->id)
            ->when($request->from, fn ($q, $f) => $q->where('date', '>=', $f))
            ->when($request->to, fn ($q, $t) => $q->where('date', '<=', $t))
            ->orderByDesc('date')
            ->paginate(config('company.pagination_per_page'));

        $todaySheet = AttendanceSheet::where('employee_id', $employee->id)
            ->where('date', now()->toDateString())
            ->first();

        $hasPunchedIn = TimeLog::where('employee_id', $employee->id)
            ->whereDate('punched_at', now()->toDateString())
            ->where('type', 'in')
            ->exists();

        $hasPunchedOut = TimeLog::where('employee_id', $employee->id)
            ->whereDate('punched_at', now()->toDateString())
            ->where('type', 'out')
            ->exists();

        return Inertia::render('attendance/my', compact(
            'sheets',
            'todaySheet',
            'hasPunchedIn',
            'hasPunchedOut',
        ));
    }

    public function index(Request $request): Response
    {
        Gate::authorize('attendance.view_branch');

        $sheets = AttendanceSheet::with('employee')
            ->when($request->from, fn ($q, $f) => $q->where('date', '>=', $f))
            ->when($request->to, fn ($q, $t) => $q->where('date', '<=', $t))
            ->when($request->search, function ($q) use ($request) {
                $s = $request->search;
                $q->whereHas('employee', function ($q) use ($s) {
                    $q->where('first_name', 'like', '%'.$s.'%')
                        ->orWhere('last_name', 'like', '%'.$s.'%');
                });
            })
            ->orderByDesc('date')
            ->paginate(config('company.pagination_per_page'));

        $employees = Employee::where('account_id', TenantContext::id())
            ->where('status', 'active')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name']);

        return Inertia::render('attendance/sheets/index', compact('sheets', 'employees'));
    }

    public function manual(Request $request): SymfonyResponse
    {
        Gate::authorize('attendance.create_manual');

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'type' => 'nullable|string|in:in,out,lunch_out,lunch_in',
            'punched_at' => 'nullable|date',
            'punch_in' => 'nullable|date',
            'punch_out' => 'nullable|date',
            'lunch_out' => 'nullable|date',
            'lunch_in' => 'nullable|date',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $accountId = TenantContext::id();
        $tz = $employee->account->timezone ?? 'Asia/Manila';

        if (! empty($validated['punch_in'])) {
            TimeLog::create([
                'account_id' => $accountId,
                'employee_id' => $employee->id,
                'type' => 'in',
                'source' => 'manual',
                'punched_at' => Carbon::parse($validated['punch_in'], $tz)->setTimezone('UTC'),
            ]);
        }

        if (! empty($validated['punch_out'])) {
            TimeLog::create([
                'account_id' => $accountId,
                'employee_id' => $employee->id,
                'type' => 'out',
                'source' => 'manual',
                'punched_at' => Carbon::parse($validated['punch_out'], $tz)->setTimezone('UTC'),
            ]);
        }

        if (! empty($validated['lunch_out'])) {
            TimeLog::create([
                'account_id' => $accountId,
                'employee_id' => $employee->id,
                'type' => 'lunch_out',
                'source' => 'manual',
                'punched_at' => Carbon::parse($validated['lunch_out'], $tz)->setTimezone('UTC'),
            ]);
        }

        if (! empty($validated['lunch_in'])) {
            TimeLog::create([
                'account_id' => $accountId,
                'employee_id' => $employee->id,
                'type' => 'lunch_in',
                'source' => 'manual',
                'punched_at' => Carbon::parse($validated['lunch_in'], $tz)->setTimezone('UTC'),
            ]);
        }

        if (! empty($validated['type']) && ! empty($validated['punched_at'])) {
            TimeLog::create([
                'account_id' => $accountId,
                'employee_id' => $employee->id,
                'type' => $validated['type'],
                'source' => 'manual',
                'punched_at' => Carbon::parse($validated['punched_at'], $tz)->setTimezone('UTC'),
            ]);
        }

        $date = null;
        if (! empty($validated['punch_in'])) {
            $date = Carbon::parse($validated['punch_in'], $tz)->toDateString();
        } elseif (! empty($validated['punched_at'])) {
            $date = Carbon::parse($validated['punched_at'], $tz)->toDateString();
        }

        if ($date) {
            $this->attendanceService->processDailyAttendance($employee, $date);
        }

        session()->flash('flash.success', 'Manual log created.');

        return Inertia::location(route('attendance.sheets.index', request()->only(['from', 'to', 'search'])));
    }

    public function adjust(Request $request, AttendanceSheet $sheet): SymfonyResponse
    {
        Gate::authorize('attendance.adjust');

        $validated = $request->validate([
            'punch_in' => 'nullable|date_format:H:i',
            'punch_out' => 'nullable|date_format:H:i',
            'lunch_out' => 'nullable|date_format:H:i',
            'lunch_in' => 'nullable|date_format:H:i',
            'note' => 'required|string|max:255',
        ]);

        $employee = $sheet->employee;
        $date = $sheet->date->toDateString();
        $tz = $employee->account->timezone ?? 'Asia/Manila';

        $types = ['in' => 'punch_in', 'out' => 'punch_out', 'lunch_out' => 'lunch_out', 'lunch_in' => 'lunch_in'];

        foreach ($types as $logType => $inputKey) {
            if (! empty($validated[$inputKey])) {
                $punchedAt = Carbon::parse("{$date} {$validated[$inputKey]}", $tz)->setTimezone('UTC');

                $log = TimeLog::where('employee_id', $employee->id)
                    ->whereDate('punched_at', $date)
                    ->where('type', $logType)
                    ->first();

                if ($log) {
                    $log->update([
                        'punched_at' => $punchedAt,
                        'source' => 'adjusted',
                    ]);
                } else {
                    TimeLog::create([
                        'account_id' => TenantContext::id(),
                        'employee_id' => $employee->id,
                        'type' => $logType,
                        'source' => 'adjusted',
                        'punched_at' => $punchedAt,
                    ]);
                }
            }
        }

        $this->attendanceService->processDailyAttendance($employee, $date);

        $this->auditService->logAction(
            modelType: TimeLog::class,
            modelId: $sheet->id,
            action: 'adjusted',
            description: "Punch times for {$employee->fullName()} on {$date} adjusted by ".auth()->user()->employee->fullName().'. Note: '.$validated['note'],
            newValues: array_filter($validated, fn ($k) => $k !== 'note', ARRAY_FILTER_USE_KEY),
        );

        session()->flash('flash.success', 'Punch times adjusted and attendance recomputed.');

        return Inertia::location(route('attendance.sheets.index', request()->only(['from', 'to', 'search'])));
    }

    public function processPay(Request $request): RedirectResponse
    {
        Gate::authorize('attendance.adjust');

        $validated = $request->validate([
            'date' => 'required|date',
        ]);

        $date = Carbon::parse($validated['date'])->toDateString();

        $sheets = AttendanceSheet::whereDate('date', $date)->get();

        foreach ($sheets as $sheet) {
            $this->attendanceService->processDailyPay($sheet);
        }

        return redirect()->back()->with('flash.success', "Pay processed for {$date} ({$sheets->count()} records).");
    }
}
