<?php

namespace App\Models;

use App\Models\Concerns\BelongsToAccount;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use BelongsToAccount;

    public $timestamps = false;

    public $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'changes' => 'array',
        'created_at' => 'datetime',
        'account_id' => 'integer',
        'user_id' => 'integer',
        'employee_id' => 'integer',
        'model_id' => 'integer',
    ];

    protected $guarded = [];

    protected function asDateTime($value)
    {
        return parent::asDateTime($value);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function formattedCreatedAt(): string
    {
        if (! $this->created_at) {
            return '';
        }

        $tz = $this->account?->timezone ?? 'Asia/Manila';
        $createdAt = $this->created_at->copy()->setTimezone($tz);

        $date = $createdAt->format('Y-m-d');
        $time = $createdAt->format('g:i A');

        if ($time === '12:00 AM') {
            return $date;
        }

        return $date.' '.$time;
    }

    public function toArray()
    {
        $array = parent::toArray();

        $array['created_at_formatted'] = $this->formattedCreatedAt();
        $array['employee_name'] = $this->employee?->fullName();

        return $array;
    }
}
