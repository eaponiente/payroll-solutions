<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use App\Traits\Auditable;
use Database\Factories\OvertimeRequestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OvertimeRequest extends Model
{
    /** @use HasFactory<OvertimeRequestFactory> */
    use Auditable, BelongsToAccount, HasFactory;

    protected $fillable = [
        'account_id',
        'employee_id',
        'date',
        'requested_minutes',
        'reason',
        'shift_type',
        'multiplier',
        'status',
        'approved_by',
        'approved_at',
        'denial_reason',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'requested_minutes' => 'integer',
            'multiplier' => 'decimal:3',
            'approved_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'approved_by');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }
}
