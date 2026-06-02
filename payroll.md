# Payroll System — Architecture & Implementation Spec

**Standalone reference for building a payroll system from scratch.**

---

## Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Schema](#2-database-schema)
3. [Business Rules](#3-business-rules)
4. [API Routes](#4-api-routes)
5. [RBAC & Authorization](#5-rbac--authorization)
6. [Edge Cases](#6-edge-cases)
7. [Payslip Design](#7-payslip-design)
8. [Frontend Pages](#8-frontend-pages)
9. [Testing](#9-testing)

---

## 1. Architecture Overview

### Multi-Tenant Design

```
Account (tenant)
└── Users (via account_user pivot)
    └── Employees (via employee_id FK on users)
        └── Role (dynamic, per-account)
            └── Permissions (with scope: account | self)
```

- **Accounts** are top-level tenants (e.g., a restaurant chain, a company).
- Users are linked to accounts via the `account_user` pivot table.
- Employees belong to an account and have a role.
- Roles are defined per-account and grant permissions with a scope level.
- There are **no branches** — employees have an optional `location` string for labeling.

### 3-Layer Data Flow

```
time_logs  ──→  attendance_sheets  ──→  payroll_period_items
  (raw)          (daily worksheets)       (period summaries)
  immutable      re-computable            permanently locked on approval
```

- **Layer 1: `time_logs`** — raw punch records, append-only, never mutated after creation
- **Layer 2: `attendance_sheets`** — daily computed worksheets, re-computable until locked
- **Layer 3: `payroll_period_items`** — aggregated per pay period, permanently locked on approval

### Computation Triggers

| Trigger                            | What Runs                                      | Purpose                                                  |
| ---------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| Per punch (event-driven)           | `processDailyAttendance()` for employee + date | Real-time status: late warnings, daily wage estimate, OT |
| Batch sweep (Saturday after shift) | `processBranchAttendance()` for all employees  | Re-verify week's sheets, flag incomplete days            |
| On correction approval             | `processDailyAttendance()` for employee + date | Regenerate corrected sheet                               |
| Payroll period generation          | Lock sheets, aggregate into period items       | Finalize pay period                                      |

---

## 2. Database Schema

### 2.1 `accounts`

| Column                     | Type        | Notes                        |
| -------------------------- | ----------- | ---------------------------- |
| `id`                       | bigint PK   |                              |
| `name`                     | string(100) | Tenant display name          |
| `slug`                     | string(100) | Unique, URL-safe identifier  |
| `is_active`                | boolean     | Default true                 |
| `created_at`, `updated_at` | timestamps  |                              |

### 2.2 `employees`

The `employees` table is the single source of truth for all person data. Auth lives on `users` linked via `employee_id`.

| Column                     | Type               | Default                   | Notes                                                    |
| -------------------------- | ------------------ | ------------------------- | -------------------------------------------------------- |
| `id`                       | bigint PK          | auto                      | Used as FK by `users` table for auth linkage             |
| `account_id`               | foreignId          | nullable                  | FK to accounts. Tenant scope.                            |
| `role_id`                  | foreignId          | nullable                  | FK to roles. Dynamic permission source.                  |
| `employee_number`          | string(50), unique | auto: `EMP-{YEAR}-{0001}` | Also used as default `username` for login                |
| `username`                 | string(50), unique | auto (employee_number)    | Login identifier. Defaults to employee_number on create. |
| `location`                 | string(100)        | nullable                  | Optional label (e.g., "Main Office", "Warehouse")        |
| `first_name`               | string(100)        | required                  |                                                          |
| `last_name`                | string(100)        | required                  |                                                          |
| `middle_name`              | string(100)        | nullable                  |                                                          |
| `phone`                    | string(20)         | nullable                  |                                                          |
| `address`                  | string(500)        | nullable                  |                                                          |
| `birth_date`               | date               | nullable                  |                                                          |
| `hire_date`                | date               | required                  |                                                          |
| `end_date`                 | date               | nullable                  | Set on resignation/termination                           |
| `position`                 | string(50)         | `'regular'`               | `regular`, `contractual`, `project_based`                |
| `status`                   | string(20)         | `'active'`                | `active`, `resigned`, `terminated`                       |
| `current_daily_rate`       | decimal(10,2)      | required                  | Synced from latest salary record                         |
| `sss_number`               | string(20)         | nullable                  | Required for SSS deduction                               |
| `philhealth_number`        | string(20)         | nullable                  | Required for PhilHealth deduction                        |
| `pagibig_number`           | string(20)         | nullable                  | Required for Pag-IBIG deduction                          |
| `tin_number`               | string(20)         | nullable                  |                                                          |
| `leaves_used_this_year`    | integer            | `0`                       | Resets Jan 1. Max 5 paid leaves/year.                    |
| `notes`                    | text               | nullable                  |                                                          |
| `deleted_at`               | timestamp          | nullable                  | Soft deletes                                             |
| `created_at`, `updated_at` | timestamps         |                           |                                                          |

Indexes: `username` (unique), `status`, `position`, `account_id`, `role_id`

**Important**: Use `$table->string()` not `$table->enum()` for SQLite compatibility.

### 2.3 `users` (Auth-only)

| Column                      | Type                          | Notes                                    |
| --------------------------- | ----------------------------- | ---------------------------------------- |
| `id`                        | bigint PK                     |                                          |
| `employee_id`               | foreignId, unique             | FK to employees. One auth per employee.  |
| `email`                     | string(255), nullable, unique | For login + password reset               |
| `password`                  | string(255), nullable         | Hashed. Admin sets on create.            |
| `email_verified_at`         | timestamp, nullable           |                                          |
| `remember_token`            | string(100), nullable         |                                          |
| `two_factor_secret`         | text, nullable                |                                          |
| `two_factor_recovery_codes` | text, nullable                |                                          |
| `is_enabled`                | boolean                       | Default `true`. Admin can disable login. |
| `last_login_at`             | timestamp, nullable           |                                          |
| `created_at`, `updated_at`  | timestamps                    |                                          |

### 2.4 `account_user` (pivot)

Links users directly to accounts. A user can belong to one or more accounts.

| Column                     | Type      | Notes                             |
| -------------------------- | --------- | --------------------------------- |
| `id`                       | bigint PK |                                   |
| `account_id`               | foreignId | FK to accounts                    |
| `user_id`                  | foreignId | FK to users                       |
| `is_owner`                 | boolean   | Whether this user owns the account |
| `created_at`, `updated_at` | timestamps |                                  |

Unique: `[account_id, user_id]`

### 2.5 Role & Permission System

Dynamic roles are defined per account. Permissions are global definitions. Each role-permission grant has a **scope** (account or self).

#### 2.5.1 `permissions`

| Column                     | Type        | Notes                            |
| -------------------------- | ----------- | -------------------------------- |
| `id`                       | bigint PK   |                                  |
| `name`                     | string(100) | Human-readable label             |
| `slug`                     | string(100) | Unique, used in Gate::authorize  |
| `group`                    | string(50)  | UI grouping (employees, payroll) |
| `created_at`, `updated_at` | timestamps  |                                  |

**29 built-in permissions:**

| slug | name | group |
|------|------|-------|
| employees.view | View Employees | employees |
| employees.create | Create Employees | employees |
| employees.edit | Edit Employees | employees |
| employees.delete | Delete Employees | employees |
| employees.rehire | Rehire Employees | employees |
| payroll.view | View Payroll | payroll |
| payroll.generate | Generate Payroll | payroll |
| payroll.approve | Approve Payroll | payroll |
| payroll.void | Void Payroll | payroll |
| payslips.view | View Payslips | payslips |
| attendance.punch | Punch IN/OUT | attendance |
| attendance.view_own | View Own Attendance | attendance |
| attendance.view_branch | View All Attendance Sheets | attendance |
| attendance.create_manual | Create Manual Logs | attendance |
| overtime.submit | Submit Overtime | overtime |
| overtime.approve | Approve Overtime | overtime |
| leaves.submit | Submit Leave | leaves |
| leaves.approve | Approve Leave | leaves |
| corrections.submit | Submit Corrections | corrections |
| corrections.approve | Approve Corrections | corrections |
| cash_advances.submit | Submit Cash Advance | cash_advances |
| cash_advances.approve | Approve Cash Advance | cash_advances |
| fines.view | View Fines | fines |
| fines.create | Create Fines | fines |
| admin.manage_roles | Manage Roles | admin |
| admin.manage_holidays | Manage Holidays | admin |
| admin.manage_config | Manage Company Config | admin |
| admin.manage_sss | Manage SSS Brackets | admin |
| admin.manage_ot_rates | Manage OT Rates | admin |

#### 2.5.2 `roles`

| Column                     | Type        | Notes                                  |
| -------------------------- | ----------- | -------------------------------------- |
| `id`                       | bigint PK   |                                        |
| `account_id`               | foreignId   | FK to accounts. Per-tenant roles.      |
| `name`                     | string(100) | Display name                           |
| `slug`                     | string(100) | Unique per account                     |
| `is_default`               | boolean     | Owner role = true, cannot be deleted   |
| `created_at`, `updated_at` | timestamps  |                                        |

Unique: `[account_id, slug]`

#### 2.5.3 `role_permission` (pivot)

| Column                     | Type       | Notes                                        |
| -------------------------- | ---------- | -------------------------------------------- |
| `id`                       | bigint PK  |                                              |
| `role_id`                  | foreignId  | FK to roles, cascade delete                  |
| `permission_id`            | foreignId  | FK to permissions, cascade delete            |
| `scope`                    | string(20) | `account` or `self`                          |
| `created_at`, `updated_at` | timestamps |                                              |

Unique: `[role_id, permission_id]`

**Permission checking logic** (implemented on `Employee::can()`):

```php
public function can(string $permissionSlug, mixed $target = null): bool
{
    $permission = $this->role->permissions()->where('slug', $permissionSlug)->first();
    if (! $permission) return false;
    $scope = $permission->pivot->scope;
    if ($scope === 'account') return true;
    if ($target === null) return true;
    if ($scope === 'self' && $this->id === $target->id) return true;
    return false;
}
```

**Gate integration** (AppServiceProvider::boot):

```php
Gate::before(function ($user, $ability, $arguments) {
    $employee = $user->employee;
    if (! $employee) return null;
    $target = $arguments[0] instanceof Model ? $arguments[0] : null;
    return $employee->can($ability, $target) ?: null;
});
```

### 2.6 `salaries`

| Column                     | Type           | Notes                                      |
| -------------------------- | -------------- | ------------------------------------------ |
| `id`                       | bigint PK      |                                            |
| `employee_id`              | foreignId      | FK to employees, cascade delete            |
| `daily_rate`               | decimal(10,2)  |                                            |
| `effective_date`           | date           | When this rate became effective            |
| `end_date`                 | date, nullable | When this rate ended. NULL = current rate. |
| `notes`                    | text, nullable | Reason for change                          |
| `created_at`, `updated_at` | timestamps     |                                            |

Indexes: `[employee_id, effective_date]`, `[employee_id, end_date]`

### 2.7 `time_logs`

| Column         | Type                | Notes                                       |
| -------------- | ------------------- | ------------------------------------------- |
| `id`           | bigint PK           |                                             |
| `employee_id`  | foreignId           | FK to employees                             |
| `type`         | string(20)          | `in`, `out`, `lunch_out`, `lunch_in`        |
| `source`       | string(20)          | `self_service`, `manual`, `correction`      |
| `punched_at`   | datetime            | Actual punch timestamp                      |
| `duplicate_of` | foreignId, nullable | FK to time_logs. Set for duplicate punches. |
| `created_at`   | timestamp           | No updated_at (immutable)                   |

Indexes: `[employee_id, punched_at]`, `[employee_id, type, punched_at]`

**Immutable**: Once created, never updated. Corrections create new rows with `source=correction`.

### 2.8 `attendance_sheets`

| Column                      | Type                   | Notes                                                                              |
| --------------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| `id`                        | bigint PK              |                                                                                    |
| `employee_id`               | foreignId              |                                                                                    |
| `date`                      | date                   | The work date                                                                      |
| `schedule_start`            | time                   | e.g., `08:00`                                                                      |
| `schedule_end`              | time                   | e.g., `17:00`                                                                      |
| `is_rest_day`               | boolean                |                                                                                    |
| `time_in`                   | time, nullable         |                                                                                    |
| `time_out`                  | time, nullable         |                                                                                    |
| `lunch_out`                 | time, nullable         |                                                                                    |
| `lunch_in`                  | time, nullable         |                                                                                    |
| `regular_hours`             | decimal(4,2)           | Hours worked (after late/undertime/lunch deductions)                               |
| `late_minutes`              | integer                |                                                                                    |
| `undertime_minutes`         | decimal(5,2)           | Includes over-lunch minutes                                                        |
| `overtime_minutes`          | integer                | lower-of-two: min(actual, approved)                                                |
| `is_present`                | boolean                |                                                                                    |
| `absence_type`              | string(30), nullable   | `unexcused`, `approved_leave`                                                      |
| `has_leave`                 | boolean                |                                                                                    |
| `leave_type`                | string(20), nullable   | `vacation`, `sick`, `emergency`, `maternity`, `paternity`, `bereavement`, `unpaid` |
| `leave_duration`            | string(15), nullable   | `full_day`, `half_day_am`, `half_day_pm`                                           |
| `leave_hours_worked`        | decimal(4,2), nullable | Hours worked during leave                                                          |
| `is_holiday`                | boolean                |                                                                                    |
| `holiday_type`              | string(10), nullable   | `regular`, `special`                                                               |
| `holiday_worked`            | boolean                |                                                                                    |
| `day_before_present`        | boolean, nullable      | For regular unworked holidays                                                      |
| `overtime_approved_minutes` | integer                | From approved OT request                                                           |
| `ot_multiplier`             | decimal(5,3), nullable | OT multiplier snapshot at OT approval time                                         |
| `gross_pay`                 | decimal(10,2)          |                                                                                    |
| `late_deduction`            | decimal(10,2)          |                                                                                    |
| `undertime_deduction`       | decimal(10,2)          |                                                                                    |
| `overtime_pay`              | decimal(10,2)          |                                                                                    |
| `holiday_pay`               | decimal(10,2)          |                                                                                    |
| `holiday_pay_percent`       | decimal(5,2), nullable | 0, 100, 130, 200                                                                   |
| `locked_at`                 | timestamp, nullable    | Set on payroll period generation                                                   |
| `created_at`, `updated_at`  | timestamps             |                                                                                    |

Unique index: `[employee_id, date]`

### 2.9 `employee_schedules`

| Column                     | Type           | Notes                                   |
| -------------------------- | -------------- | --------------------------------------- |
| `id`                       | bigint PK      |                                         |
| `employee_id`              | foreignId      |                                         |
| `schedule_start`           | time           | e.g., `08:00`                           |
| `schedule_end`             | time           | e.g., `17:00`                           |
| `rest_days`                | json           | `["sunday"]` or `["saturday","sunday"]` |
| `effective_from`           | date           |                                         |
| `effective_to`             | date, nullable | NULL = currently active                 |
| `created_at`, `updated_at` | timestamps     |                                         |

### 2.10 `overtime_requests`

| Column                     | Type                   | Notes                                                           |
| -------------------------- | ---------------------- | --------------------------------------------------------------- |
| `id`                       | bigint PK              |                                                                 |
| `employee_id`              | foreignId              |                                                                 |
| `date`                     | date                   | Date of OT                                                      |
| `requested_minutes`        | integer                |                                                                 |
| `reason`                   | text                   |                                                                 |
| `shift_type`               | string(20)             | `regular_day`, `rest_day`, `regular_holiday`, `special_holiday` |
| `multiplier`               | decimal(5,3), nullable | OT multiplier snapshot at approval                               |
| `status`                   | string(20)             | `pending`, `approved`, `denied`                                 |
| `approved_by`              | foreignId, nullable    | FK to employees                                                 |
| `approved_at`              | timestamp, nullable    |                                                                 |
| `denial_reason`            | text, nullable         |                                                                 |
| `created_at`, `updated_at` | timestamps             |                                                                 |

### 2.11 `leave_requests`

| Column                     | Type                | Notes                                                                              |
| -------------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| `id`                       | bigint PK           |                                                                                    |
| `employee_id`              | foreignId           |                                                                                    |
| `date`                     | date                |                                                                                    |
| `leave_type`               | string(20)          | `vacation`, `sick`, `emergency`, `maternity`, `paternity`, `bereavement`, `unpaid` |
| `duration`                 | string(15)          | `full_day`, `half_day_am`, `half_day_pm`                                           |
| `is_paid`                  | boolean             |                                                                                    |
| `reason`                   | text                |                                                                                    |
| `status`                   | string(20)          | `pending`, `approved`, `denied`                                                    |
| `approved_by`              | foreignId, nullable | FK to users                                                                        |
| `approved_at`              | timestamp, nullable |                                                                                    |
| `denial_reason`            | text, nullable      |                                                                                    |
| `created_at`, `updated_at` | timestamps          |                                                                                    |

### 2.12 `attendance_correction_requests`

| Column                     | Type                | Notes                                                                         |
| -------------------------- | ------------------- | ----------------------------------------------------------------------------- |
| `id`                       | bigint PK           |                                                                               |
| `employee_id`              | foreignId           |                                                                               |
| `date`                     | date                |                                                                               |
| `correction_type`          | string(25)          | `missed_punch_in`, `missed_punch_out`, `time_adjustment`, `absent_to_present` |
| `requested_in`             | time, nullable      |                                                                               |
| `requested_out`            | time, nullable      |                                                                               |
| `reason`                   | text                | Required                                                                      |
| `status`                   | string(20)          | `pending`, `approved`, `denied`                                               |
| `resolved_time_log_id`     | foreignId, nullable | FK to time_logs (the created correction log)                                  |
| `reviewed_by`              | foreignId, nullable | FK to employees                                                               |
| `reviewed_at`              | timestamp, nullable |                                                                               |
| `denial_reason`            | text, nullable      | Required on denial                                                            |
| `created_at`, `updated_at` | timestamps          |                                                                               |

### 2.13 `cash_advances`

| Column                     | Type                | Notes                                             |
| -------------------------- | ------------------- | ------------------------------------------------- |
| `id`                       | bigint PK           |                                                   |
| `employee_id`              | foreignId           |                                                   |
| `amount`                   | decimal(10,2)       | Original loan amount                              |
| `remaining_balance`        | decimal(10,2)       | Amount still unpaid                               |
| `reason`                   | text                | Required                                          |
| `status`                   | string(20)          | `pending`, `approved`, `denied`, `unpaid`, `paid` |
| `requested_by`             | foreignId           | FK to employees                                   |
| `approved_by`              | foreignId, nullable | FK to users                                       |
| `approved_at`              | timestamp, nullable |                                                   |
| `denial_reason`            | text, nullable      |                                                   |
| `created_at`, `updated_at` | timestamps          |                                                   |

### 2.14 `payroll_periods`

| Column                     | Type                | Notes                         |
| -------------------------- | ------------------- | ----------------------------- |
| `id`                       | bigint PK           |                               |
| `account_id`               | foreignId           |                               |
| `period_start`             | date                | Monday                        |
| `period_end`               | date                | Saturday                      |
| `status`                   | string(20)          | `draft`, `approved`, `voided` |
| `approved_by`              | foreignId, nullable |                               |
| `approved_at`              | timestamp, nullable |                               |
| `created_at`, `updated_at` | timestamps          |                               |

### 2.15 `payroll_period_items`

| Column                     | Type          | Notes                            |
| -------------------------- | ------------- | -------------------------------- |
| `id`                       | bigint PK     |                                  |
| `payroll_period_id`        | foreignId     | FK to payroll_periods            |
| `employee_id`              | foreignId     |                                  |
| `daily_rate`               | decimal(10,2) | Rate snapshot at generation time |
| `total_regular_days`       | integer       |                                  |
| `absent_days`              | integer       |                                  |
| `holiday_days`             | integer       |                                  |
| `late_minutes`             | integer       | Total across period              |
| `undertime_minutes`        | decimal(5,2)  | Total across period              |
| `overtime_minutes`         | integer       | Total across period              |
| `gross_pay`                | decimal(10,2) |                                  |
| `late_deduction`           | decimal(10,2) |                                  |
| `undertime_deduction`      | decimal(10,2) |                                  |
| `overtime_pay`             | decimal(10,2) |                                  |
| `holiday_pay`              | decimal(10,2) |                                  |
| `fine_deduction`           | decimal(10,2) |                                  |
| `sss_deduction`            | decimal(10,2) |                                  |
| `philhealth_deduction`     | decimal(10,2) |                                  |
| `pagibig_deduction`        | decimal(10,2) |                                  |
| `cash_advance_deduction`   | decimal(10,2) |                                  |
| `net_pay`                  | decimal(10,2) | gross_pay − deductions           |
| `created_at`, `updated_at` | timestamps    |                                  |

### 2.16 `holidays`

| Column                     | Type        | Notes                      |
| -------------------------- | ----------- | -------------------------- |
| `id`                       | bigint PK   |                            |
| `name`                     | string(255) | e.g., "Araw ng Kagitingan" |
| `date`                     | date        |                            |
| `type`                     | string(10)  | `regular`, `special`       |
| `created_at`, `updated_at` | timestamps  |                            |

### 2.17 `sss_contribution_brackets`

| Column                     | Type          | Notes                        |
| -------------------------- | ------------- | ---------------------------- |
| `id`                       | bigint PK     |                              |
| `salary_min`               | decimal(10,2) |                              |
| `salary_max`               | decimal(10,2) | Highest bracket has null max |
| `employee_percentage`      | decimal(5,2)  | e.g., `4.50`                 |
| `employer_percentage`      | decimal(5,2)  | e.g., `8.50`                 |
| `effective_from`           | date          |                              |
| `created_at`, `updated_at` | timestamps    |                              |

### 2.18 `company_configurations`

| Column                     | Type                | Notes                              |
| -------------------------- | ------------------- | ---------------------------------- |
| `id`                       | bigint PK           |                                    |
| `key`                      | string(100), unique | e.g., `philhealth_premium_percent` |
| `value`                    | string(255)         |                                    |
| `created_at`, `updated_at` | timestamps          |                                    |

### 2.19 `fines`

| Column                     | Type         | Notes              |
| -------------------------- | ------------ | ------------------ |
| `id`                       | bigint PK    |                    |
| `employee_id`              | foreignId    |                    |
| `date`                     | date         |                    |
| `fine_type`                | string(50)   | e.g., `no_uniform` |
| `amount`                   | decimal(8,2) |                    |
| `reason`                   | text         | Required           |
| `marked_by`                | foreignId    | FK to employees    |
| `created_at`, `updated_at` | timestamps   |                    |

### 2.20 `ot_rate_configs`

| Column                     | Type         | Notes                                                           |
| -------------------------- | ------------ | --------------------------------------------------------------- |
| `id`                       | bigint PK    |                                                                 |
| `shift_type`               | string(20)   | `regular_day`, `rest_day`, `regular_holiday`, `special_holiday` |
| `multiplier`               | decimal(5,3) | Labor law multiplier (e.g., 1.250 for regular day OT)           |
| `created_at`, `updated_at` | timestamps   |                                                                 |

OT pay is computed as: `(daily_rate / 8) × multiplier × (ot_minutes / 60)`.

Multipliers are hardcoded per Philippine labor law and seeded automatically:

| Shift Type       | Multiplier |
| ---------------- | ---------- |
| `regular_day`    | 1.250      |
| `rest_day`       | 1.690      |
| `regular_holiday`| 2.600      |
| `special_holiday`| 1.690      |

---

## 3. Business Rules

(All business rules from section 3 remain unchanged — late deduction, daily wage, OT pay, lunch model, holiday pay, leave, fines, cash advances, government contributions, and payslip formulas are the same as the original spec. The only structural difference is that branches are removed and accounts are the top-level isolation boundary.)

---

## 4. API Routes

All routes require `['auth', 'verified', 'employee']` middleware unless noted.

### Payroll

| Method   | Path                                        | Name                         | Gate                              |
| -------- | ------------------------------------------- | ---------------------------- | --------------------------------- |
| `GET`    | `/payroll`                                  | `payroll.index`              | `employees.view` (implicit)      |
| `GET`    | `/payroll/employees`                        | `employees.index`            | `employees.view`                 |
| `GET`    | `/payroll/employees/create`                 | `employees.create`           | `employees.create`               |
| `POST`   | `/payroll/employees`                        | `employees.store`            | `employees.create`               |
| `GET`    | `/payroll/employees/{employee}`             | `employees.show`             | `employees.view` (target)        |
| `GET`    | `/payroll/employees/{employee}/edit`        | `employees.edit`             | `employees.edit` (target)        |
| `PUT`    | `/payroll/employees/{employee}`             | `employees.update`           | `employees.edit` (target)        |
| `DELETE` | `/payroll/employees/{employee}`             | `employees.destroy`          | `employees.delete` (target)      |
| `POST`   | `/payroll/employees/{employee}/rehire`      | `employees.rehire`           | `employees.rehire` (target)      |
| `GET`    | `/payroll/employees/{employee}/salaries`    | `employees.salaries`         | `employees.view` (target)        |
| `POST`   | `/payroll/employees/{employee}/salaries`    | `employees.salaries.store`   | `employees.edit` (target)        |
| `GET`    | `/payroll/periods`                          | `payroll.periods.index`      | `payroll.view`                   |
| `POST`   | `/payroll/periods`                          | `payroll.periods.generate`   | `payroll.generate`               |
| `GET`    | `/payroll/periods/{period}`                 | `payroll.periods.show`       | `payroll.view`                   |
| `POST`   | `/payroll/periods/{period}/approve`         | `payroll.periods.approve`    | `payroll.approve`                |
| `POST`   | `/payroll/periods/{period}/void`            | `payroll.periods.void`       | `payroll.void`                   |
| `GET`    | `/payroll/payslips/{employee}`              | `payroll.payslips.show`      | `payslips.view` (target)         |

### Attendance

| Method  | Path                                       | Name                      | Gate                               |
| ------- | ------------------------------------------ | ------------------------- | ---------------------------------- |
| `POST`  | `/attendance/punch`                        | `attendance.punch`        | `attendance.punch`                |
| `GET`   | `/attendance/my`                           | `attendance.my`           | `attendance.view_own`             |
| `GET`   | `/attendance/sheets`                       | `attendance.sheets.index` | `attendance.view_branch`          |
| `POST`  | `/attendance/sheets/manual`                | `attendance.sheets.manual`| `attendance.create_manual`        |
| `GET`   | `/attendance/overtime-requests`            | `overtime.index`          | `overtime.submit`                 |
| `POST`  | `/attendance/overtime-requests`            | `overtime.store`          | `overtime.submit`                 |
| `PATCH` | `/attendance/overtime-requests/{id}/approve`| `overtime.approve`       | `overtime.approve` (target)       |
| `PATCH` | `/attendance/overtime-requests/{id}/deny`  | `overtime.deny`           | `overtime.approve` (target)       |
| `GET`   | `/attendance/leave-requests`               | `leave.index`             | `leaves.submit`                   |
| `POST`  | `/attendance/leave-requests`               | `leave.store`             | `leaves.submit`                   |
| `PATCH` | `/attendance/leave-requests/{id}/approve`  | `leave.approve`           | `leaves.approve` (target)         |
| `PATCH` | `/attendance/leave-requests/{id}/deny`     | `leave.deny`              | `leaves.approve` (target)         |
| `GET`   | `/attendance/corrections`                  | `corrections.index`       | `corrections.submit`              |
| `POST`  | `/attendance/corrections`                  | `corrections.store`       | `corrections.submit`              |
| `PATCH` | `/attendance/corrections/{id}/approve`     | `corrections.approve`     | `corrections.approve` (target)    |
| `PATCH` | `/attendance/corrections/{id}/deny`        | `corrections.deny`        | `corrections.approve` (target)    |
| `GET`   | `/attendance/cash-advances`                | `cash-advances.index`     | `cash_advances.submit`            |
| `POST`  | `/attendance/cash-advances`                | `cash-advances.store`     | `cash_advances.submit`            |
| `PATCH` | `/attendance/cash-advances/{id}/approve`   | `cash-advances.approve`   | `cash_advances.approve` (target)  |
| `PATCH` | `/attendance/cash-advances/{id}/deny`      | `cash-advances.deny`      | `cash_advances.approve` (target)  |
| `GET`   | `/attendance/fines`                        | `fines.index`             | `fines.view`                      |
| `POST`  | `/attendance/fines`                        | `fines.store`             | `fines.create`                    |

### Admin

| Method   | Path                        | Name                  | Gate                      |
| -------- | --------------------------- | --------------------- | ------------------------- |
| `GET`    | `/admin/roles`              | `roles.index`         | `admin.manage_roles`      |
| `POST`   | `/admin/roles`              | `roles.store`         | `admin.manage_roles`      |
| `PUT`    | `/admin/roles/{role}`       | `roles.update`        | `admin.manage_roles`      |
| `DELETE` | `/admin/roles/{role}`       | `roles.destroy`       | `admin.manage_roles`      |
| `GET`    | `/admin/holidays`           | `holidays.index`      | `admin.manage_holidays`   |
| `POST`   | `/admin/holidays`           | `holidays.store`      | `admin.manage_holidays`   |
| `PUT`    | `/admin/holidays/{holiday}` | `holidays.update`     | `admin.manage_holidays`   |
| `DELETE` | `/admin/holidays/{holiday}` | `holidays.destroy`    | `admin.manage_holidays`   |
| `GET`    | `/admin/config`             | `config.index`        | `admin.manage_config`     |
| `PUT`    | `/admin/config`             | `config.update`       | `admin.manage_config`     |
| `GET`    | `/admin/sss-brackets`       | `sss-brackets.index`  | `admin.manage_sss`        |
| `PUT`    | `/admin/sss-brackets`       | `sss-brackets.update` | `admin.manage_sss`        |

---

## 5. RBAC & Authorization

### Architecture

Roles and permissions are stored in the database. Every controller method calls `Gate::authorize('permission.slug', $target)` which flows through:

```
Gate::before → Employee::can($slug, $target) → Role::permissions(pivot.scope) → allow/deny
```

No hardcoded role names anywhere. The sidebar visibility is permission-based via `auth.user.permissions[]` shared from Inertia middleware.

### Scope Levels

| Scope     | Meaning                                         |
| --------- | ----------------------------------------------- |
| `account` | All records within the employee's account       |
| `self`    | Only records belonging to the authenticated employee |

### Default Roles (created per account)

**Owner** (all 29 permissions at `account` scope) — created by `payroll:setup`.

Additional roles (Manager, Employee) can be created via the admin UI at `/admin/roles`.

### Setup Command

```
php artisan payroll:setup --name="Company Name" --email=admin@example.com --password=password
```

This creates: Account → Owner role (all permissions) → Employee → User.

### Policy Matrix (by permission, not role)

Every action is gated by a specific permission slug. The scope on the permission determines visibility:
- `account` scope → all employees in the tenant
- `self` scope → own records only

---

## 6. Edge Cases

(All edge cases E1–E52 from the original spec remain unchanged. The structural changes — removing branches, adding accounts, dynamic permissions — do not affect the business logic edge cases.)

---

## 7. Payslip Design

### Header Section

```
┌──────────────────────────────────────────────────────────────────┐
│  Company Name                                                    │
│  Location: Main Office                                           │
│                                                                  │
│  PAYSLIP — Weekly                                                │
│  Period: May 18–23, 2026 (Week 3 · Mon–Sat)                     │
│                                                                  │
│  Employee:  Juan Dela Cruz          Position:  Regular           │
│  Emp #:     EMP-2026-0001           Daily Rate: ₱510.00          │
│  SSS:       12-3456789-0            PhilHealth: 12-345678901-2   │
│  Pag-IBIG:  1234-5678-9012          TIN:        —                │
│  Monthly Salary: ₱13,260 (daily × 26)  ·  SSS Bracket #7         │
├──────────────────────────────────────────────────────────────────┤
│  Attendance Summary:  Present 5  Late 1 (15min)  OT 0h  Absent 0  Holiday 0 │
└──────────────────────────────────────────────────────────────────┘
```

(Body and footer layouts remain the same as the original spec — two-column earnings/deductions with net pay total.)

---

## 8. Frontend Pages

### Page Components (20 total)

| Section | Pages |
|---------|-------|
| **Payroll** | payroll/index, employees/index, employees/create, employees/show, employees/edit, employees/salaries |
| **Payroll Periods** | periods/index, periods/show |
| **Payslips** | payslips/show |
| **Attendance** | my, sheets/index, overtime/index, leaves/index, corrections/index, cash-advances/index, fines/index |
| **Admin** | roles/index, holidays/index, config/index, sss-brackets/index |

### Shared Components

| Component | Purpose |
|-----------|---------|
| `FilterDropdown` | Reusable filter icon button → dropdown with checkboxes + text/select inputs + Apply/Clear |
| `Heading` | Section title + description |
| `NavMain` | Sidebar navigation group with label |

### Reusable FilterDropdown Usage

```tsx
import { FilterDropdown } from '@/components/filter-dropdown';
import type { FilterFieldDef } from '@/components/filter-dropdown';

const fields: FilterFieldDef[] = [
    { key: 'first_name', label: 'First Name', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: [...] },
];

<FilterDropdown
    fields={fields}
    onApply={(filters, search) => router.get(url, params)}
    onClear={() => router.get(url)}
/>
```

---

## 9. Testing

### Test Strategy

197 Pest tests across 15 test files. All use `RefreshDatabase` with SQLite in-memory.

### Test Helpers

```php
actingAsAccountUser(['employees.view' => 'self', 'attendance.punch' => 'self'])
// Creates: Account → Role (with given permission slugs + scopes) → Employee → User
// Logs in the user via test()->actingAs($user)
```

### Key Assertion Patterns

```php
// Inertia page load
$response->assertOk()->assertInertia(fn ($page) => $page->component('payroll/employees/index'));

// Permission denied
$response->assertStatus(403);

// Redirect with flash
$response->assertRedirect()->assertSessionHas('flash.success');

// Validation errors
$response->assertSessionHasErrors(['field_name']);
```

### Test Files

| File | Tests | Covers |
|------|-------|--------|
| EmployeeTest | 37 | CRUD, scoping, search, filters, validation |
| PunchTest | 8 | Punch in/out/lunch, duplicates, inactive |
| MyAttendanceTest | 6 | Own attendance view, date filters |
| SheetsTest | 5 | Admin sheets, manual logs |
| OvertimeTest | 8 | Submit, approve, deny, validation |
| LeaveTest | 8 | Submit, approve (increment), deny, 5-leaves warning |
| CorrectionTest | 7 | Submit, approve (recompute), deny |
| CashAdvanceTest | 6 | Submit, max-receivable, duplicate blocking |
| FineTest | 5 | Record fine, filters, validation |
| PeriodTest | 12 | Generate, show, approve, void |
| PayslipTest | 7 | Own vs other, admin access |
| HolidayTest | 10 | CRUD, uniqueness, validation |
| ConfigTest | 8 | Update, validation |
| SssTest | 10 | Bulk replace, validation |
| OtRateTest | 13 | All 8 fields, updateOrCreate |
