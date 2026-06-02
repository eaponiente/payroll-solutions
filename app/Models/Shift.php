<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Database\Factories\ShiftFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    /** @use HasFactory<ShiftFactory> */
    use BelongsToAccount, HasFactory;

    protected $fillable = [
        'account_id',
        'name',
        'start_time',
        'end_time',
        'night_differential',
        'rest_days',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'night_differential' => 'boolean',
            'rest_days' => 'array',
            'start_time' => 'datetime',
            'end_time' => 'datetime',
        ];
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(EmployeeShiftAssignment::class);
    }
}
