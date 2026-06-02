<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SwitchAccountController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'employee'])->group(function () {

    // Role Management
    Route::get('/admin/roles', [RoleController::class, 'index'])->name('roles.index');
    Route::post('/admin/roles', [RoleController::class, 'store'])->name('roles.store');
    Route::put('/admin/roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::delete('/admin/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');

    // Holidays
    Route::get('/admin/holidays', [AdminController::class, 'holidays'])->name('holidays.index');
    Route::post('/admin/holidays', [AdminController::class, 'storeHoliday'])->name('holidays.store');
    Route::put('/admin/holidays/{holiday}', [AdminController::class, 'updateHoliday'])->name('holidays.update');
    Route::delete('/admin/holidays/{holiday}', [AdminController::class, 'destroyHoliday'])->name('holidays.destroy');

    // Company Configuration
    Route::get('/admin/config', [AdminController::class, 'config'])->name('config.index');
    Route::put('/admin/config', [AdminController::class, 'updateConfig'])->name('config.update');

    // SSS Brackets
    Route::get('/admin/sss-brackets', [AdminController::class, 'sssBrackets'])->name('sss-brackets.index');
    Route::put('/admin/sss-brackets', [AdminController::class, 'updateSssBrackets'])->name('sss-brackets.update');

    // Audit Logs
    Route::get('/admin/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');

    // Account Switching
    Route::post('/admin/switch-account/{account}', SwitchAccountController::class)->name('switch-account');
});
