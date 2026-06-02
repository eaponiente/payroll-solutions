<?php

namespace App\Models\Scopes;

use App\Context\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

final class AccountScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $id = TenantContext::id();

        if ($id !== null) {
            $builder->where($model->qualifyColumn('account_id'), $id);
        }
    }
}
