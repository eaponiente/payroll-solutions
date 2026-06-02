<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollPeriodItem extends Model
{
    use BelongsToAccount, HasFactory;

    protected $fillable = [
        'account_id',
        'payroll_period_id',
        'employee_id',
        'daily_rate',
        'total_regular_days',
        'absent_days',
        'holiday_days',
        'late_minutes',
        'undertime_minutes',
        'overtime_minutes',
        'gross_pay',
        'late_deduction',
        'undertime_deduction',
        'overtime_pay',
        'holiday_pay',
        'fine_deduction',
        'sss_deduction',
        'philhealth_deduction',
        'pagibig_deduction',
        'cash_advance_deduction',
        'other_deduction',
        'net_pay',
        'leaves_present',
        'rest_days_present',
        'holiday_worked',
        'night_differential_pay',
        'thirteenth_month_pay',
        'deminimis_total',
        'retroactive_pay',
    ];

    protected function casts(): array
    {
        return [
            'daily_rate' => 'decimal:2',
            'total_regular_days' => 'integer',
            'absent_days' => 'integer',
            'holiday_days' => 'integer',
            'late_minutes' => 'integer',
            'undertime_minutes' => 'decimal:2',
            'overtime_minutes' => 'integer',
            'gross_pay' => 'decimal:2',
            'late_deduction' => 'decimal:2',
            'undertime_deduction' => 'decimal:2',
            'overtime_pay' => 'decimal:2',
            'holiday_pay' => 'decimal:2',
            'fine_deduction' => 'decimal:2',
            'sss_deduction' => 'decimal:2',
            'philhealth_deduction' => 'decimal:2',
            'pagibig_deduction' => 'decimal:2',
            'cash_advance_deduction' => 'decimal:2',
            'other_deduction' => 'decimal:2',
            'net_pay' => 'decimal:2',
            'leaves_present' => 'integer',
            'rest_days_present' => 'integer',
            'holiday_worked' => 'integer',
            'night_differential_pay' => 'decimal:2',
            'thirteenth_month_pay' => 'decimal:2',
            'deminimis_total' => 'decimal:2',
            'retroactive_pay' => 'decimal:2',
        ];
    }

    public function payrollPeriod(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
