<?php

use App\Http\Controllers\Payroll\DeMinimisController;
use App\Http\Controllers\Payroll\EmployeeController;
use App\Http\Controllers\Payroll\PayrollPeriodController;
use App\Http\Controllers\Payroll\PayslipController;
use App\Http\Controllers\Payroll\RetroactivePaymentController;
use App\Http\Controllers\Payroll\ScheduleController;
use App\Http\Controllers\Payroll\ShiftController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'employee'])->group(function () {

    // Dashboard / payroll overview
    Route::get('/payroll', function () {
        return inertia('payroll/index');
    })->name('payroll.index');

    // Employee CRUD
    Route::get('/payroll/employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::get('/payroll/employees/create', [EmployeeController::class, 'create'])->name('employees.create');
    Route::post('/payroll/employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::get('/payroll/employees/{employee}', [EmployeeController::class, 'show'])->name('employees.show');
    Route::get('/payroll/employees/{employee}/edit', [EmployeeController::class, 'edit'])->name('employees.edit');
    Route::put('/payroll/employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::delete('/payroll/employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
    Route::post('/payroll/employees/{employee}/rehire', [EmployeeController::class, 'rehire'])->name('employees.rehire');
    Route::get('/payroll/employees/{employee}/salaries', [EmployeeController::class, 'salaries'])->name('employees.salaries');
    Route::post('/payroll/employees/{employee}/salaries', [EmployeeController::class, 'addSalary'])->name('employees.salaries.store');

    // Retroactive Payments
    Route::post('/payroll/employees/{employee}/retroactive', [RetroactivePaymentController::class, 'store'])->name('employees.retroactive.store');
    Route::delete('/payroll/employees/retroactive/{retroactive}', [RetroactivePaymentController::class, 'destroy'])->name('employees.retroactive.destroy');

    // De Minimis Benefits
    Route::post('/payroll/employees/{employee}/deminimis', [DeMinimisController::class, 'store'])->name('employees.deminimis.store');
    Route::delete('/payroll/employees/deminimis/{entry}', [DeMinimisController::class, 'destroy'])->name('employees.deminimis.destroy');

    // De Minimis Benefits Management
    Route::get('/payroll/deminimis', [DeMinimisController::class, 'index'])->name('deminimis.index');
    Route::post('/payroll/deminimis/templates', [DeMinimisController::class, 'storeTemplate'])->name('deminimis.templates.store');
    Route::put('/payroll/deminimis/templates/{benefit}', [DeMinimisController::class, 'updateTemplate'])->name('deminimis.templates.update');

    // Employee Schedule
    Route::post('/payroll/employees/{employee}/schedule', [ScheduleController::class, 'store'])->name('employees.schedule.store');

    // Shifts
    Route::prefix('payroll/shifts')->name('shifts.')->group(function () {
        Route::get('/', [ShiftController::class, 'index'])->name('index');
        Route::post('/', [ShiftController::class, 'store'])->name('store');
        Route::put('/{shift}', [ShiftController::class, 'update'])->name('update');
        Route::delete('/{shift}', [ShiftController::class, 'destroy'])->name('destroy');
        Route::post('/bulk-assign', [ShiftController::class, 'bulkAssign'])->name('bulk-assign');
        Route::get('/roster', [ShiftController::class, 'roster'])->name('roster');
    });

    Route::post('/payroll/employees/{employee}/shift', [ShiftController::class, 'assignDate'])->name('employees.shift.assign');
    Route::delete('/payroll/employees/{employee}/shift', [ShiftController::class, 'unassignDate'])->name('employees.shift.unassign');

    // Payroll Periods
    Route::get('/payroll/periods', [PayrollPeriodController::class, 'index'])->name('payroll.periods.index');
    Route::post('/payroll/periods', [PayrollPeriodController::class, 'generate'])->name('payroll.periods.generate');
    Route::get('/payroll/periods/{period}', [PayrollPeriodController::class, 'show'])->name('payroll.periods.show');
    Route::post('/payroll/periods/{period}/approve', [PayrollPeriodController::class, 'approve'])->name('payroll.periods.approve');
    Route::post('/payroll/periods/{period}/void', [PayrollPeriodController::class, 'void'])->name('payroll.periods.void');
    Route::get('/payroll/periods/{period}/print', [PayrollPeriodController::class, 'print'])->name('payroll.periods.print');

    // Payslips
    Route::get('/payroll/payslips/{employee}', [PayslipController::class, 'show'])->name('payroll.payslips.show');
});
