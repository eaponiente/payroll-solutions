<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('time_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts');
            $table->foreignId('employee_id')->constrained('employees');
            $table->string('type', 20);
            $table->string('source', 20);
            $table->dateTime('punched_at');
            $table->foreignId('duplicate_of')->nullable()->constrained('time_logs');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['employee_id', 'punched_at']);
            $table->index(['employee_id', 'type', 'punched_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_logs');
    }
};
