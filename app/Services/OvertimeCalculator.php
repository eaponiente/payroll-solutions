<?php

namespace App\Services;

final class OvertimeCalculator
{
    private const array MULTIPLIERS = [
        'regular_day' => 1.250,
        'rest_day' => 1.690,
        'regular_holiday' => 2.600,
        'special_holiday' => 1.690,
    ];

    public static function multiplier(string $shiftType): float
    {
        return self::MULTIPLIERS[$shiftType] ?? 1.0;
    }
}
