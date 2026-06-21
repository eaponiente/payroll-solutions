<?php

namespace App\Http\Controllers;

use App\Models\AttendanceCorrectionRequest;
use App\Models\AttendanceSheet;
use App\Models\CashAdvance;
use App\Models\Employee;
use App\Models\Fine;
use App\Models\LeaveRequest;
use App\Models\OvertimeRequest;
use App\Models\TimeLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $today = today();
        $employee = auth()->user()?->employee;

        return Inertia::render('dashboard', [
            'pending' => [
                'overtime' => OvertimeRequest::where('status', 'pending')->count(),
                'leaves' => LeaveRequest::where('status', 'pending')->count(),
                'corrections' => AttendanceCorrectionRequest::where('status', 'pending')->count(),
                'cash_advances' => CashAdvance::where('status', 'pending')->count(),
                'fines' => Fine::whereMonth('date', $today->month)->whereYear('date', $today->year)->count(),
            ],
            'todayAttendance' => [
                'present' => AttendanceSheet::whereDate('date', $today)->where('is_present', true)->where('late_minutes', 0)->count(),
                'late' => AttendanceSheet::whereDate('date', $today)->where('late_minutes', '>', 0)->count(),
                'absent' => AttendanceSheet::whereDate('date', $today)->where('is_present', false)->where('has_leave', false)->count(),
                'on_leave' => AttendanceSheet::whereDate('date', $today)->where('has_leave', true)->count(),
            ],
            'totalEmployees' => Employee::where('status', 'active')->count(),
            'myTodaySheet' => $employee
                ? AttendanceSheet::where('employee_id', $employee->id)->whereDate('date', $today)->first()
                : null,
            'hasPunchedIn' => $employee
                ? TimeLog::where('employee_id', $employee->id)->whereDate('punched_at', $today)->where('type', 'in')->exists()
                : false,
            'hasPunchedOut' => $employee
                ? TimeLog::where('employee_id', $employee->id)->whereDate('punched_at', $today)->where('type', 'out')->exists()
                : false,
            'recentLogs' => $employee
                ? TimeLog::where('employee_id', $employee->id)->latest('punched_at')->take(10)->get()
                : collect(),
        ]);
    }
}
