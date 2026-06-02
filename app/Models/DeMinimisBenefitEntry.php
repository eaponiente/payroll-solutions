<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeMinimisBenefitEntry extends Model
{
    use BelongsToAccount, HasFactory;

    protected $fillable = [
        'account_id',
        'employee_id',
        'deminimis_benefit_id',
        'amount',
        'date',
        'payroll_period_id',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'date' => 'date',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function benefit(): BelongsTo
    {
        return $this->belongsTo(DeMinimisBenefit::class, 'deminimis_benefit_id');
    }
}
