<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Database\Factories\EmployeeShiftAssignmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeShiftAssignment extends Model
{
    /** @use HasFactory<EmployeeShiftAssignmentFactory> */
    use BelongsToAccount, HasFactory;

    protected $fillable = [
        'account_id',
        'employee_id',
        'shift_id',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class);
    }
}
