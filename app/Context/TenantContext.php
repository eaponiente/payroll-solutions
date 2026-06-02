<?php

namespace App\Context;

final class TenantContext
{
    private static ?int $accountId = null;

    public static function set(?int $id): void
    {
        self::$accountId = $id;
    }

    public static function id(): ?int
    {
        return self::$accountId;
    }
}
