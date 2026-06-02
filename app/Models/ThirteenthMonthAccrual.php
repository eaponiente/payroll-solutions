<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThirteenthMonthAccrual extends Model
{
    use BelongsToAccount, HasFactory;

    protected $fillable = [
        'account_id',
        'employee_id',
        'year',
        'total_basic_pay',
        'prorated_amount',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'total_basic_pay' => 'decimal:2',
            'prorated_amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
