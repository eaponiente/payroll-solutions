<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('employee_number', 50)->unique();
            $table->string('username', 50)->unique();
            $table->foreignId('account_id')->constrained('accounts');
            $table->foreignId('role_id')->nullable()->constrained('roles');
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('address', 500)->nullable();
            $table->date('birth_date')->nullable();
            $table->date('hire_date');
            $table->date('end_date')->nullable();
            $table->string('position', 50)->default('regular');
            $table->string('status', 20)->default('active');
            $table->decimal('current_daily_rate', 10, 2);
            $table->string('sss_number', 20)->nullable();
            $table->string('philhealth_number', 20)->nullable();
            $table->string('pagibig_number', 20)->nullable();
            $table->string('tin_number', 20)->nullable();
            $table->integer('leaves_used_this_year')->default(0);
            $table->string('location', 100)->nullable();
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index('username');
            $table->index('status');
            $table->index('position');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
