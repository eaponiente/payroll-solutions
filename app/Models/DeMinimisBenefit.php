<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeMinimisBenefit extends Model
{
    use BelongsToAccount, HasFactory;

    protected $fillable = [
        'account_id',
        'name',
        'default_amount',
        'frequency',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'default_amount' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function entries(): HasMany
    {
        return $this->hasMany(DeMinimisBenefitEntry::class, 'deminimis_benefit_id');
    }
}
