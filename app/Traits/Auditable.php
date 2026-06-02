<?php

namespace App\Traits;

use App\Services\AuditService;

trait Auditable
{
    protected static function bootAuditable(): void
    {
        static::created(function ($model) {
            app(AuditService::class)->logModelEvent($model, 'created');
        });

        static::updated(function ($model) {
            app(AuditService::class)->logModelEvent($model, 'updated');
        });

        static::deleted(function ($model) {
            app(AuditService::class)->logModelEvent($model, 'deleted');
        });
    }
}
