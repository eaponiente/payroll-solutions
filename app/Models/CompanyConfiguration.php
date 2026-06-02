<?php

namespace App\Models;

use App\Context\TenantContext;
use App\Models\Concerns\BelongsToAccount;
use Database\Factories\CompanyConfigurationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyConfiguration extends Model
{
    /** @use HasFactory<CompanyConfigurationFactory> */
    use BelongsToAccount, HasFactory;

    protected $fillable = [
        'account_id',
        'key',
        'value',
    ];

    public static function getValue(string $key, mixed $default = null, ?int $accountId = null): mixed
    {
        $config = static::where('key', $key)
            ->where('account_id', $accountId ?? TenantContext::id())
            ->first();

        return $config ? $config->value : $default;
    }

    public static function setValue(string $key, string $value, ?int $accountId = null): void
    {
        $accountId = $accountId ?? TenantContext::id();

        static::updateOrCreate(
            ['key' => $key, 'account_id' => $accountId],
            ['value' => $value],
        );
    }
}
