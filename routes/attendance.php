<?php

use App\Http\Controllers\Attendance\CashAdvanceController;
use App\Http\Controllers\Attendance\CorrectionController;
use App\Http\Controllers\Attendance\FineController;
use App\Http\Controllers\Attendance\LeaveController;
use App\Http\Controllers\Attendance\OvertimeController;
use App\Http\Controllers\Attendance\TimeLogController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'employee'])->group(function () {

    // Punch IN/OUT
    Route::post('/attendance/punch', [TimeLogController::class, 'punch'])->name('attendance.punch');

    // My attendance
    Route::get('/attendance/my', [TimeLogController::class, 'myAttendance'])->name('attendance.my');

    // Attendance sheets (admin view)
    Route::get('/attendance/sheets', [TimeLogController::class, 'index'])->name('attendance.sheets.index');
    Route::post('/attendance/sheets/manual', [TimeLogController::class, 'manual'])->name('attendance.sheets.manual');
    Route::post('/attendance/sheets/{sheet}/adjust', [TimeLogController::class, 'adjust'])->name('attendance.sheets.adjust');
    Route::post('/attendance/sheets/process-pay', [TimeLogController::class, 'processPay'])->name('attendance.sheets.process-pay');

    // Overtime
    Route::get('/attendance/overtime-requests', [OvertimeController::class, 'index'])->name('overtime.index');
    Route::post('/attendance/overtime-requests', [OvertimeController::class, 'store'])->name('overtime.store');
    Route::patch('/attendance/overtime-requests/{overtime}/approve', [OvertimeController::class, 'approve'])->name('overtime.approve');
    Route::patch('/attendance/overtime-requests/{overtime}/deny', [OvertimeController::class, 'deny'])->name('overtime.deny');

    // Leave
    Route::get('/attendance/leave-requests', [LeaveController::class, 'index'])->name('leave.index');
    Route::post('/attendance/leave-requests', [LeaveController::class, 'store'])->name('leave.store');
    Route::patch('/attendance/leave-requests/{leave}/approve', [LeaveController::class, 'approve'])->name('leave.approve');
    Route::patch('/attendance/leave-requests/{leave}/deny', [LeaveController::class, 'deny'])->name('leave.deny');

    // Corrections
    Route::get('/attendance/corrections', [CorrectionController::class, 'index'])->name('corrections.index');
    Route::post('/attendance/corrections', [CorrectionController::class, 'store'])->name('corrections.store');
    Route::patch('/attendance/corrections/{correction}/approve', [CorrectionController::class, 'approve'])->name('corrections.approve');
    Route::patch('/attendance/corrections/{correction}/deny', [CorrectionController::class, 'deny'])->name('corrections.deny');

    // Cash Advances
    Route::get('/attendance/cash-advances', [CashAdvanceController::class, 'index'])->name('cash-advances.index');
    Route::post('/attendance/cash-advances', [CashAdvanceController::class, 'store'])->name('cash-advances.store');
    Route::patch('/attendance/cash-advances/{cashAdvance}/approve', [CashAdvanceController::class, 'approve'])->name('cash-advances.approve');
    Route::patch('/attendance/cash-advances/{cashAdvance}/deny', [CashAdvanceController::class, 'deny'])->name('cash-advances.deny');

    // Fines
    Route::get('/attendance/fines', [FineController::class, 'index'])->name('fines.index');
    Route::post('/attendance/fines', [FineController::class, 'store'])->name('fines.store');
});
