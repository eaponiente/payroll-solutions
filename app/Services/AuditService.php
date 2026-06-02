<?php

namespace App\Services;

use App\Context\TenantContext;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

class AuditService
{
    private const SENSITIVE_FIELDS = [
        'updated_at',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'password',
    ];

    public function logModelEvent(Model $model, string $action): void
    {
        if ($action === 'updated' && empty($model->getChanges())) {
            return;
        }

        $user = auth()->user();
        $employee = $user?->employee;
        $accountId = TenantContext::id() ?? $employee?->account_id;

        $old = null;
        $new = null;
        $changes = null;

        if ($action === 'updated') {
            $dirty = $model->getDirty();
            $original = $model->getOriginal();

            $changes = [];
            $old = [];
            $new = [];

            foreach ($dirty as $key => $value) {
                if (in_array($key, self::SENSITIVE_FIELDS)) {
                    continue;
                }

                $oldVal = $original[$key] ?? null;
                $newVal = $value;

                if ($oldVal instanceof \DateTimeInterface) {
                    $oldVal = $oldVal->format('Y-m-d H:i:s');
                }

                $changes[$key] = [
                    'before' => $oldVal,
                    'after' => $newVal,
                ];

                $old[$key] = $oldVal;
                $new[$key] = $newVal;
            }

            if (empty($changes)) {
                return;
            }
        } elseif ($action === 'created') {
            $new = $model->getAttributes();

            foreach ($new as $key => &$value) {
                if ($value instanceof \DateTimeInterface) {
                    $value = $value->format('Y-m-d H:i:s');
                }
            }

            unset($new['updated_at']);

            foreach (self::SENSITIVE_FIELDS as $field) {
                unset($new[$field]);
            }
        } elseif ($action === 'deleted') {
            $old = $model->getAttributes();

            foreach ($old as $key => &$value) {
                if ($value instanceof \DateTimeInterface) {
                    $value = $value->format('Y-m-d H:i:s');
                }
            }
        }

        AuditLog::create([
            'account_id' => $accountId,
            'user_id' => $user?->id,
            'employee_id' => $employee?->id,
            'action' => $action,
            'model_type' => get_class($model),
            'model_id' => $model->getKey(),
            'old_values' => $old,
            'new_values' => $new,
            'changes' => $changes,
            'description' => $this->buildDescription($model, $action, $employee, $changes),
            'ip_address' => request()->ip(),
            'created_at' => now(),
        ]);
    }

    public function logAction(string $modelType, int $modelId, string $action, string $description, ?array $oldValues = null, ?array $newValues = null, ?array $changes = null): void
    {
        $user = auth()->user();
        $employee = $user?->employee;
        $accountId = TenantContext::id() ?? $employee?->account_id;

        AuditLog::create([
            'account_id' => $accountId,
            'user_id' => $user?->id,
            'employee_id' => $employee?->id,
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'changes' => $changes,
            'description' => $description,
            'ip_address' => request()->ip(),
            'created_at' => now(),
        ]);
    }

    private function buildDescription(Model $model, string $action, $employee, ?array $changes): string
    {
        $modelName = class_basename($model);
        $identifier = $model->employee_number
            ?? $model->name
            ?? $model->email
            ?? $model->id;

        $by = $employee ? ' by '.$employee->fullName() : '';

        $pastTense = match ($action) {
            'created' => 'created',
            'updated' => 'updated',
            'deleted' => 'deleted',
            default => $action,
        };

        $desc = "{$modelName} {$identifier} was {$pastTense}{$by}";

        if ($changes && $action === 'updated') {
            $fields = implode(', ', array_keys($changes));
            $desc .= '. Changed: '.$fields;
        }

        return $desc;
    }
}
