<?php

namespace App\Models;

use Database\Factories\SssContributionBracketFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SssContributionBracket extends Model
{
    /** @use HasFactory<SssContributionBracketFactory> */
    use HasFactory;

    protected $fillable = [
        'salary_min',
        'salary_max',
        'employee_percentage',
        'employer_percentage',
        'effective_from',
    ];

    protected function casts(): array
    {
        return [
            'salary_min' => 'decimal:2',
            'salary_max' => 'decimal:2',
            'employee_percentage' => 'decimal:2',
            'employer_percentage' => 'decimal:2',
            'effective_from' => 'date',
        ];
    }
}
