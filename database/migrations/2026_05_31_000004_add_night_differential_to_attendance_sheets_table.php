<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_sheets', function (Blueprint $table) {
            $table->decimal('night_differential_pay', 10, 2)->default(0)->after('overtime_pay');
            $table->decimal('night_differential_hours', 5, 2)->default(0)->after('night_differential_pay');
        });
    }

    public function down(): void
    {
        Schema::table('attendance_sheets', function (Blueprint $table) {
            $table->dropColumn(['night_differential_pay', 'night_differential_hours']);
        });
    }
};
