<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use App\Traits\Auditable;
use Database\Factories\EmployeeScheduleFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSchedule extends Model
{
    /** @use HasFactory<EmployeeScheduleFactory> */
    use Auditable, BelongsToAccount, HasFactory;

    protected $fillable = [
        'account_id',
        'employee_id',
        'schedule_start',
        'schedule_end',
        'rest_days',
        'effective_from',
        'effective_to',
    ];

    protected function casts(): array
    {
        return [
            'schedule_start' => 'datetime',
            'schedule_end' => 'datetime',
            'rest_days' => 'array',
            'effective_from' => 'date',
            'effective_to' => 'date',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
