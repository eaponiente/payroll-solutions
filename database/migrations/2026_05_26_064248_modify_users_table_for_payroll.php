<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('employee_id')->after('id')->nullable()->unique()->constrained('employees');
            $table->boolean('is_enabled')->after('password')->default(true);
            $table->timestamp('last_login_at')->after('remember_token')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['employee_id']);
            $table->dropColumn(['employee_id', 'is_enabled', 'last_login_at']);
        });
    }
};
