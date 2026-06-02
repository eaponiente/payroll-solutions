<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class PayrollLedger extends Model
{
    use BelongsToAccount;

    protected $table = 'payroll_ledger';

    public $timestamps = false;

    protected $fillable = [
        'account_id',
        'ledger_type',
        'reference_type',
        'reference_id',
        'employee_id',
        'description',
        'debit',
        'credit',
        'balance',
        'metadata',
        'hash',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'debit' => 'decimal:2',
            'credit' => 'decimal:2',
            'balance' => 'decimal:2',
            'metadata' => 'json',
            'created_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public static function previousHash(int $accountId): string
    {
        $last = static::where('account_id', $accountId)
            ->latest('id')
            ->first();

        return $last?->hash ?? str_repeat('0', 64);
    }

    public static function insertEntry(array $data): self
    {
        return DB::transaction(function () use ($data) {
            $accountId = $data['account_id'] ?? throw new \InvalidArgumentException('account_id is required');

            $previousHash = static::previousHash($accountId);

            $payload = json_encode([
                'ledger_type' => $data['ledger_type'],
                'reference_type' => $data['reference_type'] ?? null,
                'reference_id' => $data['reference_id'] ?? null,
                'employee_id' => $data['employee_id'] ?? null,
                'description' => $data['description'],
                'debit' => $data['debit'] ?? 0,
                'credit' => $data['credit'] ?? 0,
                'metadata' => $data['metadata'] ?? null,
                'created_at' => ($data['created_at'] ?? now())->toISOString(),
            ]);

            $hash = hash('sha256', $previousHash.$payload);

            $data['hash'] = $hash;

            return static::create([...$data, 'created_at' => $data['created_at'] ?? now()]);
        });
    }
}
