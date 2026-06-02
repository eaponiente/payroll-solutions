<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('thirteenth_month_accruals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts');
            $table->foreignId('employee_id')->constrained('employees');
            $table->year('year');
            $table->decimal('total_basic_pay', 10, 2)->default(0);
            $table->decimal('prorated_amount', 10, 2)->default(0);
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->unique(['employee_id', 'year']);
        });

        Schema::create('de_minimis_benefits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts');
            $table->string('name', 100);
            $table->decimal('default_amount', 10, 2);
            $table->string('frequency', 20)->default('monthly');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('de_minimis_benefit_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts');
            $table->foreignId('employee_id')->constrained('employees');
            $table->foreignId('deminimis_benefit_id')->constrained('de_minimis_benefits');
            $table->decimal('amount', 10, 2);
            $table->date('date');
            $table->foreignId('payroll_period_id')->nullable()->constrained('payroll_periods');
            $table->timestamps();
        });

        Schema::create('retroactive_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts');
            $table->foreignId('employee_id')->constrained('employees');
            $table->string('description', 255);
            $table->decimal('amount', 10, 2);
            $table->date('effective_from');
            $table->date('effective_to');
            $table->foreignId('payroll_period_id')->nullable()->constrained('payroll_periods');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retroactive_payments');
        Schema::dropIfExists('de_minimis_benefit_entries');
        Schema::dropIfExists('de_minimis_benefits');
        Schema::dropIfExists('thirteenth_month_accruals');
    }
};
