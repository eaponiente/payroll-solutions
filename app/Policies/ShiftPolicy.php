<?php

namespace App\Policies;

use App\Context\TenantContext;
use App\Models\Shift;
use App\Models\User;

class ShiftPolicy
{
    private function isShifting(User $user): bool
    {
        return $user->employee && $user->employee->account->schedule_type === 'shifting';
    }

    public function viewAny(User $user): bool
    {
        return $this->isShifting($user) && $user->employee->can('admin.manage_shifts');
    }

    public function view(User $user, Shift $shift): bool
    {
        return $this->isShifting($user) && $user->employee->can('admin.manage_shifts')
            && $shift->account_id === TenantContext::id();
    }

    public function create(User $user): bool
    {
        return $this->isShifting($user) && $user->employee->can('admin.manage_shifts');
    }

    public function update(User $user, Shift $shift): bool
    {
        return $this->isShifting($user) && $user->employee->can('admin.manage_shifts')
            && $shift->account_id === TenantContext::id();
    }

    public function delete(User $user, Shift $shift): bool
    {
        return $this->isShifting($user) && $user->employee->can('admin.manage_shifts')
            && $shift->account_id === TenantContext::id();
    }

    public function assign(User $user): bool
    {
        return $this->isShifting($user) && $user->employee->can('admin.manage_shifts');
    }
}
