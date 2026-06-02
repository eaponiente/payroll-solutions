<?php

namespace App\Policies;

use App\Models\Employee;
use App\Models\User;

class SchedulePolicy
{
    public function manage(User $user, Employee $employee): bool
    {
        return $user->employee && $user->employee->can('employees.edit', $employee);
    }
}
