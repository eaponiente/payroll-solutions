<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use App\Traits\Auditable;
use Database\Factories\AttendanceCorrectionRequestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceCorrectionRequest extends Model
{
    /** @use HasFactory<AttendanceCorrectionRequestFactory> */
    use Auditable, BelongsToAccount, HasFactory;

    protected $fillable = [
        'account_id',
        'employee_id',
        'date',
        'correction_type',
        'requested_in',
        'requested_out',
        'reason',
        'status',
        'resolved_time_log_id',
        'reviewed_by',
        'reviewed_at',
        'denial_reason',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'reviewed_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function resolvedTimeLog(): BelongsTo
    {
        return $this->belongsTo(TimeLog::class, 'resolved_time_log_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'reviewed_by');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
