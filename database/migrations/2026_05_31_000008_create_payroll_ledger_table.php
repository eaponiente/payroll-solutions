<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_ledger', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts');
            $table->string('ledger_type', 50);
            $table->string('reference_type', 100)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->foreignId('employee_id')->nullable()->constrained('employees');
            $table->string('description', 500);
            $table->decimal('debit', 12, 2)->default(0);
            $table->decimal('credit', 12, 2)->default(0);
            $table->decimal('balance', 12, 2)->default(0);
            $table->json('metadata')->nullable();
            $table->string('hash', 64);
            $table->timestamp('created_at')->useCurrent();
        });

        DB::statement('CREATE INDEX payroll_ledger_type_idx ON payroll_ledger (account_id, ledger_type)');
        DB::statement('CREATE INDEX payroll_ledger_employee_idx ON payroll_ledger (employee_id)');
        DB::statement('CREATE INDEX payroll_ledger_reference_idx ON payroll_ledger (reference_type, reference_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_ledger');
    }
};
