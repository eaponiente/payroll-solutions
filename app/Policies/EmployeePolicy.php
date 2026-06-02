<?php

namespace App\Policies;

use App\Models\Employee;
use App\Models\User;

class EmployeePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->employee && $user->employee->can('employees.view');
    }

    public function view(User $user, Employee $employee): bool
    {
        return $user->employee && $user->employee->can('employees.view', $employee);
    }

    public function create(User $user): bool
    {
        return $user->employee && $user->employee->can('employees.create');
    }

    public function edit(User $user, Employee $employee): bool
    {
        return $user->employee && $user->employee->can('employees.edit', $employee);
    }

    public function delete(User $user, Employee $employee): bool
    {
        return $user->employee && $user->employee->can('employees.delete', $employee);
    }

    public function rehire(User $user, Employee $employee): bool
    {
        return $user->employee && $user->employee->can('employees.rehire', $employee);
    }

    public function manageSalary(User $user, Employee $employee): bool
    {
        return $user->employee && $user->employee->can('employees.salary', $employee);
    }
}
