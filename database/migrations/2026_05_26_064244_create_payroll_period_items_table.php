<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_period_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts');
            $table->foreignId('payroll_period_id')->constrained('payroll_periods');
            $table->foreignId('employee_id')->constrained('employees');
            $table->decimal('daily_rate', 10, 2);
            $table->integer('total_regular_days')->default(0);
            $table->integer('absent_days')->default(0);
            $table->integer('holiday_days')->default(0);
            $table->integer('late_minutes')->default(0);
            $table->decimal('undertime_minutes', 5, 2)->default(0);
            $table->integer('overtime_minutes')->default(0);
            $table->decimal('gross_pay', 10, 2)->default(0);
            $table->decimal('late_deduction', 10, 2)->default(0);
            $table->decimal('undertime_deduction', 10, 2)->default(0);
            $table->decimal('overtime_pay', 10, 2)->default(0);
            $table->decimal('holiday_pay', 10, 2)->default(0);
            $table->decimal('fine_deduction', 10, 2)->default(0);
            $table->decimal('sss_deduction', 10, 2)->default(0);
            $table->decimal('philhealth_deduction', 10, 2)->default(0);
            $table->decimal('pagibig_deduction', 10, 2)->default(0);
            $table->decimal('cash_advance_deduction', 10, 2)->default(0);
            $table->decimal('net_pay', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_period_items');
    }
};
