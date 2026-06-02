<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use App\Traits\Auditable;
use Database\Factories\TimeLogFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeLog extends Model
{
    /** @use HasFactory<TimeLogFactory> */
    use Auditable, BelongsToAccount, HasFactory;

    const UPDATED_AT = null;

    protected $fillable = [
        'account_id',
        'employee_id',
        'type',
        'source',
        'punched_at',
        'duplicate_of',
    ];

    protected function casts(): array
    {
        return [
            'punched_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function duplicateOf(): BelongsTo
    {
        return $this->belongsTo(TimeLog::class, 'duplicate_of');
    }

    public function isTypeIn(): bool
    {
        return $this->type === 'in';
    }

    public function isTypeOut(): bool
    {
        return $this->type === 'out';
    }

    public function isSourceCorrection(): bool
    {
        return $this->source === 'correction';
    }
}
