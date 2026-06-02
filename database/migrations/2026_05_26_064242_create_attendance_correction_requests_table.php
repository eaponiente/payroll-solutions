<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_correction_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts');
            $table->foreignId('employee_id')->constrained('employees');
            $table->date('date');
            $table->string('correction_type', 25);
            $table->time('requested_in')->nullable();
            $table->time('requested_out')->nullable();
            $table->text('reason');
            $table->string('status', 20)->default('pending');
            $table->foreignId('resolved_time_log_id')->nullable()->constrained('time_logs');
            $table->foreignId('reviewed_by')->nullable()->constrained('employees');
            $table->timestamp('reviewed_at')->nullable();
            $table->text('denial_reason')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'date', 'correction_type'], 'correction_unique_pending');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_correction_requests');
    }
};
