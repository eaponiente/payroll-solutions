<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use App\Traits\Auditable;
use Database\Factories\EmployeeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'account_id',
    'role_id',
    'employee_number',
    'username',
    'first_name',
    'last_name',
    'middle_name',
    'phone',
    'address',
    'location',
    'birth_date',
    'hire_date',
    'end_date',
    'position',
    'status',
    'current_daily_rate',
    'sss_number',
    'philhealth_number',
    'pagibig_number',
    'tin_number',
    'leaves_used_this_year',
    'paid_leaves_allowed',
    'notes',
])]
class Employee extends Model
{
    /** @use HasFactory<EmployeeFactory> */
    use Auditable, BelongsToAccount, HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'hire_date' => 'date',
            'end_date' => 'date',
            'current_daily_rate' => 'decimal:2',
            'leaves_used_this_year' => 'integer',
            'paid_leaves_allowed' => 'integer',
            'account_id' => 'integer',
            'role_id' => 'integer',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function user(): HasOne
    {
        return $this->hasOne(User::class);
    }

    public function salaries(): HasMany
    {
        return $this->hasMany(Salary::class);
    }

    public function currentSalary(): HasOne
    {
        return $this->hasOne(Salary::class)->whereNull('end_date');
    }

    public function timeLogs(): HasMany
    {
        return $this->hasMany(TimeLog::class);
    }

    public function attendanceSheets(): HasMany
    {
        return $this->hasMany(AttendanceSheet::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(EmployeeSchedule::class);
    }

    public function currentSchedule(): HasOne
    {
        return $this->hasOne(EmployeeSchedule::class)->whereNull('effective_to');
    }

    public function overtimeRequests(): HasMany
    {
        return $this->hasMany(OvertimeRequest::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function correctionRequests(): HasMany
    {
        return $this->hasMany(AttendanceCorrectionRequest::class);
    }

    public function shiftAssignments(): HasMany
    {
        return $this->hasMany(EmployeeShiftAssignment::class);
    }

    public function cashAdvances(): HasMany
    {
        return $this->hasMany(CashAdvance::class);
    }

    public function fines(): HasMany
    {
        return $this->hasMany(Fine::class);
    }

    public function retroactivePayments(): HasMany
    {
        return $this->hasMany(RetroactivePayment::class);
    }

    public function deminimisEntries(): HasMany
    {
        return $this->hasMany(DeMinimisBenefitEntry::class);
    }

    public function payrollPeriodItems(): HasMany
    {
        return $this->hasMany(PayrollPeriodItem::class);
    }

    public function fullName(): string
    {
        $parts = [$this->first_name, $this->last_name];
        if ($this->middle_name) {
            array_splice($parts, 1, 0, $this->middle_name);
        }

        return implode(' ', array_filter($parts));
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function can(string $permissionSlug, mixed $target = null): bool
    {
        if (! $this->role) {
            return false;
        }

        $permission = $this->role->permissions()
            ->where('slug', $permissionSlug)
            ->first();

        if (! $permission) {
            return false;
        }

        $scope = $permission->pivot->scope;

        if ($scope === 'account') {
            return true;
        }

        if ($target === null) {
            return true;
        }

        if ($scope === 'self' && $this->id === $target->id) {
            return true;
        }

        return false;
    }
}
