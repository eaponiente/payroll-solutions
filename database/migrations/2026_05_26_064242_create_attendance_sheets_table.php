<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_sheets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts');
            $table->foreignId('employee_id')->constrained('employees');
            $table->date('date');
            $table->time('schedule_start');
            $table->time('schedule_end');
            $table->boolean('is_rest_day')->default(false);
            $table->time('time_in')->nullable();
            $table->time('time_out')->nullable();
            $table->time('lunch_out')->nullable();
            $table->time('lunch_in')->nullable();
            $table->decimal('regular_hours', 4, 2)->default(0);
            $table->integer('late_minutes')->default(0);
            $table->decimal('undertime_minutes', 5, 2)->default(0);
            $table->integer('overtime_minutes')->default(0);
            $table->boolean('is_present')->default(false);
            $table->string('absence_type', 30)->nullable();
            $table->boolean('has_leave')->default(false);
            $table->string('leave_type', 20)->nullable();
            $table->string('leave_duration', 15)->nullable();
            $table->decimal('leave_hours_worked', 4, 2)->nullable();
            $table->boolean('is_holiday')->default(false);
            $table->string('holiday_type', 10)->nullable();
            $table->boolean('holiday_worked')->default(false);
            $table->boolean('day_before_present')->nullable();
            $table->integer('overtime_approved_minutes')->default(0);
            $table->decimal('ot_rate_30min', 8, 2)->nullable();
            $table->decimal('ot_rate_1hour', 8, 2)->nullable();
            $table->decimal('gross_pay', 10, 2)->default(0);
            $table->decimal('late_deduction', 10, 2)->default(0);
            $table->decimal('undertime_deduction', 10, 2)->default(0);
            $table->decimal('overtime_pay', 10, 2)->default(0);
            $table->decimal('holiday_pay', 10, 2)->default(0);
            $table->decimal('holiday_pay_percent', 5, 2)->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_sheets');
    }
};
