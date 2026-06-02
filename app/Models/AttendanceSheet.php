<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use App\Traits\Auditable;
use Database\Factories\AttendanceSheetFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceSheet extends Model
{
    /** @use HasFactory<AttendanceSheetFactory> */
    use Auditable, BelongsToAccount, HasFactory;

    protected $fillable = [
        'account_id',
        'employee_id',
        'date',
        'schedule_start',
        'schedule_end',
        'is_rest_day',
        'time_in',
        'time_out',
        'lunch_out',
        'lunch_in',
        'regular_hours',
        'late_minutes',
        'undertime_minutes',
        'overtime_minutes',
        'is_present',
        'absence_type',
        'has_leave',
        'leave_type',
        'leave_duration',
        'leave_hours_worked',
        'is_holiday',
        'holiday_type',
        'holiday_worked',
        'day_before_present',
        'overtime_approved_minutes',
        'ot_multiplier',
        'gross_pay',
        'late_deduction',
        'undertime_deduction',
        'overtime_pay',
        'holiday_pay',
        'holiday_pay_percent',
        'night_differential_pay',
        'night_differential_hours',
        'locked_at',
    ];

    protected $appends = ['status'];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'schedule_start' => 'datetime',
            'schedule_end' => 'datetime',
            'time_in' => 'datetime',
            'time_out' => 'datetime',
            'lunch_out' => 'datetime',
            'lunch_in' => 'datetime',
            'regular_hours' => 'decimal:2',
            'late_minutes' => 'integer',
            'undertime_minutes' => 'decimal:2',
            'overtime_minutes' => 'integer',
            'is_present' => 'boolean',
            'has_leave' => 'boolean',
            'leave_hours_worked' => 'decimal:2',
            'is_holiday' => 'boolean',
            'holiday_worked' => 'boolean',
            'day_before_present' => 'boolean',
            'overtime_approved_minutes' => 'integer',
            'ot_multiplier' => 'decimal:3',
            'gross_pay' => 'decimal:2',
            'late_deduction' => 'decimal:2',
            'undertime_deduction' => 'decimal:2',
            'overtime_pay' => 'decimal:2',
            'holiday_pay' => 'decimal:2',
            'holiday_pay_percent' => 'decimal:2',
            'night_differential_pay' => 'decimal:2',
            'night_differential_hours' => 'decimal:2',
            'locked_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function isLocked(): bool
    {
        return $this->locked_at !== null;
    }

    public function getStatusAttribute(): string
    {
        if ($this->has_leave) {
            return 'on_leave';
        }

        if (! $this->is_present) {
            return 'absent';
        }

        if ($this->late_minutes > 0) {
            return 'late';
        }

        return 'present';
    }
}
