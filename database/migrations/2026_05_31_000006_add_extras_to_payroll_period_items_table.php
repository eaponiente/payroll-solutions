<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_period_items', function (Blueprint $table) {
            $table->decimal('night_differential_pay', 10, 2)->default(0);
            $table->decimal('thirteenth_month_pay', 10, 2)->default(0);
            $table->decimal('deminimis_total', 10, 2)->default(0);
            $table->decimal('retroactive_pay', 10, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('payroll_period_items', function (Blueprint $table) {
            $table->dropColumn(['night_differential_pay', 'thirteenth_month_pay', 'deminimis_total', 'retroactive_pay']);
        });
    }
};
