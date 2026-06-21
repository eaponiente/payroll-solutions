<?php

namespace App\Http\Controllers\Attendance;

use App\Context\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\AttendanceCorrectionRequest;
use App\Models\TimeLog;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CorrectionController extends Controller
{
    public function __construct(
        private AttendanceService $attendanceService,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('corrections.submit');

        $requests = AttendanceCorrectionRequest::with(['employee', 'reviewer'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->latest()->paginate(config('company.pagination_per_page'));

        return Inertia::render('attendance/corrections/index', compact('requests'));
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('corrections.submit');

        $validated = $request->validate([
            'date' => 'required|date',
            'correction_type' => 'required|string|in:missed_punch_in,missed_punch_out,time_adjustment,absent_to_present',
            'requested_in' => 'nullable|date_format:H:i',
            'requested_out' => 'nullable|date_format:H:i',
            'reason' => 'required|string',
        ]);

        $user = auth()->user();
        $employee = $user->employee;

        // Check for existing pending request
        $existing = AttendanceCorrectionRequest::where('employee_id', $employee->id)
            ->whereDate('date', $validated['date'])
            ->where('correction_type', $validated['correction_type'])
            ->where('status', 'pending')
            ->exists();

        if ($existing) {
            return back()->with('flash.error', 'A pending correction request already exists for this date.');
        }

        AttendanceCorrectionRequest::create([
            ...$validated,
            'account_id' => TenantContext::id(),
            'employee_id' => $employee->id,
            'status' => 'pending',
        ]);

        return back()->with('flash.success', 'Correction request submitted.');
    }

    public function approve(AttendanceCorrectionRequest $correction): RedirectResponse
    {
        Gate::authorize('corrections.approve', $correction->employee);

        $reviewer = auth()->user()->employee;

        DB::transaction(function () use ($correction, $reviewer) {
            $employee = $correction->employee;
            $date = $correction->date;
            $dateStr = $date->toDateString();
            $tz = $employee->account->timezone ?? 'Asia/Manila';

            $log = null;

            // Create correction time logs
            if ($correction->correction_type === 'missed_punch_in' && $correction->requested_in) {
                $log = TimeLog::create([
                    'account_id' => TenantContext::id(),
                    'employee_id' => $employee->id,
                    'type' => 'in',
                    'source' => 'correction',
                    'punched_at' => Carbon::parse("{$dateStr} {$correction->requested_in}", $tz)->setTimezone('UTC'),
                ]);
            }

            if ($correction->correction_type === 'time_adjustment') {
                if ($correction->requested_in) {
                    $existingIn = TimeLog::where('employee_id', $employee->id)
                        ->whereDate('punched_at', $dateStr)
                        ->where('type', 'in')
                        ->first();

                    $punchedAt = Carbon::parse("{$dateStr} {$correction->requested_in}", $tz)->setTimezone('UTC');

                    if ($existingIn) {
                        $existingIn->update([
                            'punched_at' => $punchedAt,
                            'source' => 'correction',
                        ]);
                        $log = $existingIn;
                    } else {
                        $log = TimeLog::create([
                            'account_id' => TenantContext::id(),
                            'employee_id' => $employee->id,
                            'type' => 'in',
                            'source' => 'correction',
                            'punched_at' => $punchedAt,
                        ]);
                    }
                }

                if ($correction->requested_out) {
                    $existingOut = TimeLog::where('employee_id', $employee->id)
                        ->whereDate('punched_at', $dateStr)
                        ->where('type', 'out')
                        ->first();

                    $punchedAt = Carbon::parse("{$dateStr} {$correction->requested_out}", $tz)->setTimezone('UTC');

                    if ($existingOut) {
                        $existingOut->update([
                            'punched_at' => $punchedAt,
                            'source' => 'correction',
                        ]);
                        $log = $existingOut;
                    } else {
                        $log = TimeLog::create([
                            'account_id' => TenantContext::id(),
                            'employee_id' => $employee->id,
                            'type' => 'out',
                            'source' => 'correction',
                            'punched_at' => $punchedAt,
                        ]);
                    }
                }
            }

            if ($correction->correction_type === 'missed_punch_out' && $correction->requested_out) {
                $log = TimeLog::create([
                    'account_id' => TenantContext::id(),
                    'employee_id' => $employee->id,
                    'type' => 'out',
                    'source' => 'correction',
                    'punched_at' => Carbon::parse("{$dateStr} {$correction->requested_out}", $tz)->setTimezone('UTC'),
                ]);
            }

            if ($correction->correction_type === 'absent_to_present') {
                if ($correction->requested_in) {
                    TimeLog::create([
                        'account_id' => TenantContext::id(),
                        'employee_id' => $employee->id,
                        'type' => 'in',
                        'source' => 'correction',
                        'punched_at' => Carbon::parse("{$dateStr} {$correction->requested_in}", $tz)->setTimezone('UTC'),
                    ]);
                }
                if ($correction->requested_out) {
                    TimeLog::create([
                        'account_id' => TenantContext::id(),
                        'employee_id' => $employee->id,
                        'type' => 'out',
                        'source' => 'correction',
                        'punched_at' => Carbon::parse("{$dateStr} {$correction->requested_out}", $tz)->setTimezone('UTC'),
                    ]);
                }
            }

            // Recompute attendance sheet
            $this->attendanceService->processDailyAttendance($employee, $dateStr);

            $correction->update([
                'status' => 'approved',
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
                'resolved_time_log_id' => $log?->id ?? null,
            ]);
        });

        return back()->with('flash.success', 'Correction approved.');
    }

    public function deny(Request $request, AttendanceCorrectionRequest $correction): RedirectResponse
    {
        Gate::authorize('corrections.approve', $correction->employee);

        $reviewer = auth()->user()->employee;

        $validated = $request->validate([
            'denial_reason' => 'required|string',
        ]);

        $correction->update([
            'status' => 'denied',
            'denial_reason' => $validated['denial_reason'],
        ]);

        return back()->with('flash.success', 'Correction denied.');
    }
}
