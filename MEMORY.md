# Payroll — Project Memory

## Stack
Laravel 13, Inertia v3, React 19, TypeScript 5.7 strict, Tailwind v4, shadcn/ui (New York), Pest PHP, SQLite (dev)

## Multi-Tenancy

- `app/Context/TenantContext.php` — static context (`set()`, `id()`), set by `EnsureEmployeeExists` middleware
- `app/Models/Scopes/AccountScope.php` — global Eloquent scope: if `TenantContext::id()` is set, adds `->where('table.account_id', $id)` to every query
- `app/Models/Concerns/BelongsToAccount.php` — trait: adds scope via `bootBelongsToAccount()`, provides `account(): BelongsTo`
- ALL scoped models use `use BelongsToAccount;` — includes `account_id` in `$fillable`, the global scope auto-filters
- Tables WITHOUT `account_id`: `accounts`, `users` (multi-account pivot), `permissions` (global), `role_permission`, `account_user`, framework tables
- All create/store operations set `account_id` explicitly (scope only filters reads, doesn't auto-set on create)
- `SubstituteBindings` runs before `employee` middleware → during model binding, `TenantContext` is null → global scope doesn't block → model found; later save queries have scope active

## Scheduling

### Fixed Schedule (default)
- `accounts.schedule_type = 'fixed'`
- `EmployeeSchedule`: per-employee with `schedule_start`, `schedule_end`, `rest_days`, `effective_from`/`effective_to`
- ScheduleController stores/updates per-employee schedule
- Default fallback: 08:00-17:00

### Shifting Schedule (F&B/retail)
- `accounts.schedule_type = 'shifting'` — set via Admin → Config → Schedule Mode
- `Shift`: template (`name`, `start_time`, `end_time`, `night_differential`, `rest_days`, `sort_order`)
- `EmployeeShiftAssignment`: per-date (`employee_id`, `shift_id`, `date`), unique on `[employee_id, date]`
- ShiftController: CRUD + `bulkAssign` (date range + days-of-week) + `assignDate` + `unassignDate` + `roster`
- `ensureShifting()` helper returns 403 for fixed accounts
- Auth: `Gate::authorize('admin.manage_shifts')` + policy for model-level checks
- Night differential: +10% hourly rate, computed in `AttendanceService::computeNightDifferentialPay()`
- Rest days: per-shift (`rest_days` JSON on Shift)
- `getScheduleForDate()` in AttendanceService returns `{start_time, end_time, night_differential, is_rest_day}`
- `ShiftSeeder` creates Morning (06-14), Afternoon (14-22), Graveyard (22-06) for default account

### Roster page (`/payroll/shifts/roster`)
- Weekly calendar grid: employees × dates
- Click cell → dropdown to assign shift; bulk assign dialog
- `?employee_id=N` filters to single employee
- `handleAssign()` uses `router.post()` with `onSuccess → router.reload()`
- Rest days validated with abbreviated names: `sun,mon,tue,wed,thu,fri,sat`

### Date fields: schedule times vs punch times
- **`formatTimeRaw`** — for time-only columns (schedule_start/end, shift start/end): extracts HH:MM from ISO string without timezone conversion
- **`formatTime`** — for real datetimes (punch in/out): applies account timezone

## OT Rates
- `app/Services/OvertimeCalculator.php` — hardcoded Philippine Labor Code multipliers:
  - `regular_day: 1.250`, `rest_day: 1.690`, `regular_holiday: 2.600`, `special_holiday: 1.690`
- `OtRateConfig` model, factory, table, migrations DELETED — replaced by service
- `OvertimeController::approve()` uses `OvertimeCalculator::multiplier()`

## SSS Brackets
- `sss_contribution_brackets` — GLOBAL (no account_id), shared across all accounts
- `SssBracketSeeder` generates 43 brackets: MSC 1,000-30,000 in 500-peso increments, 5% EE / 10% ER for 2026
- Admin → SSS Brackets page for CRUD

## Timezone
- `accounts.timezone`, default `Asia/Manila`
- `HandleInertiaRequests::share()` passes `timezone` from account
- `resources/js/lib/date.ts` — `useDateFormatter()` hook, all formatting through `Intl.DateTimeFormat` with `timeZone` option
- `formatDate`, `formatTime`, `formatTimeRaw`, `formatDateFull`, `formatDateMd`, `formatDateYmd`
- All pages use the hook — no more `toLocaleDateString` duplication
- Admin → Config → Timezone for setting

## Roles & Permissions
- RoleController: index/store/update/destroy at `/admin/roles`
- `admin.manage_roles` permission required (scope account)
- Frontend: `resources/js/pages/admin/roles/index.tsx` — dialog-based CRUD
- `toggleGroup()` selects/deselects all permissions per module group with indeterminate checkbox
- Permissions added: `admin.manage_shifts` (for shift management)
- Seeded roles: Owner (all perms, scope account), Staff (self-service perms, scope self), NoRole (role_id=null)

## Sidebar Organization
1. My Attendance (top, standalone)
2. Payroll (Dashboard, Employees, Periods)
3. Attendance (Sheets, Overtime, Leaves, Corrections, Cash Advances, Fines)
4. Account Settings (Shifts [if shifting], Roles, Holidays, Config, SSS Brackets, Audit Logs)
- `scheduleType` shared via Inertia props — Shifts nav appears when both `admin.manage_shifts` AND `scheduleType === 'shifting'`

## Key Conventions
- PHP: Pint `laravel` preset, no comments in code, full logic (no TODOs)
- TS: `consistent-type-imports`, alphabetically grouped imports, curly braces always, 1tbs
- Date display: Y-m-d for dates, Y-m-d h:i a for datetimes
- Request validation: move to form request classes (partially done — ShiftController uses inline)
- All date fields serialized: `hire_date` as `date` cast → `Y-m-d`, schedule times as `datetime` cast → ISO string
- Factory `account_id` fields use `Account::factory()` for defaults

## Test Coverage
- 183 tests, all passing
- Backend auth/permission tests work correctly for role CRUD and shift assignment
- Tests for both fixed and shifting schedule modes exist

## Database
- SQLite for dev (database/database.sqlite), PostgreSQL for production
- Testing: SQLite in-memory (`DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`)

## Key Routes
- `routes/web.php` — includes settings, payroll, attendance, admin
- `routes/admin.php` — roles, holidays, config, SSS brackets, audit logs
- `routes/payroll.php` — employees, schedules, shifts, periods, payslips
- `routes/attendance.php` — punch, sheets, overtime, leaves, corrections, cash advances, fines

## Seeders
Run: `php artisan migrate:fresh --seed` or just `php artisan db:seed`
1. `PermissionSeeder` — 29 global permissions
2. `HolidaySeeder` — 20 Philippine holidays for 2026 (scoped to default account)
3. `SssBracketSeeder` — 43 MSC brackets (global)
4. `ShiftSeeder` — Morning/Afternoon/Graveyard for default account
5. `AccountSeeder` — Default account + Owner role + Staff role + employees (admin@example.com, staff@example.com, norole@example.com, password: password)

## Pending / Known Issues
- Form request classes not yet created for all controllers (per AGENTS.md: "Request validation should be in its own form request class")
- No `@/routes/shifts` auto-generated route helpers — shifts pages use hardcoded URLs
- Config page has 3 separate `<Form>` components (Deduction, Timezone, Schedule Mode) — each with own Save button
- `employees/show.tsx` is 734 lines (over 300-line limit) — should be split into sub-components
- Some controllers still accept arbitrary employee_id without verifying account ownership
