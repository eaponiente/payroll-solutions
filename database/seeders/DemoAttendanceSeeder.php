<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\Permission;
use App\Models\Role;
use App\Models\TimeLog;
use App\Models\User;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DemoAttendanceSeeder extends Seeder
{
    public function run(): void
    {
        $account = Account::firstOrFail();
        $service = app(AttendanceService::class);

        $role = Role::firstOrCreate(
            ['account_id' => $account->id, 'slug' => 'employee'],
            ['name' => 'Employee', 'is_default' => true],
        );

        $permissions = Permission::whereIn('slug', [
            'attendance.punch',
            'attendance.view_own',
            'overtime.submit',
            'leaves.submit',
            'corrections.submit',
            'cash_advances.submit',
            'payslips.view',
        ])->get();

        foreach ($permissions as $perm) {
            if (! $role->permissions()->where('permission_id', $perm->id)->exists()) {
                $role->permissions()->attach($perm->id, ['scope' => 'self']);
            }
        }

        $employees = $this->createEmployees($account, $role);
        $this->createSchedules($employees);
        $this->createAttendance($employees, $service);

        $this->command?->info('Demo attendance data seeded.');
    }

    private function createEmployees(Account $account, Role $role): array
    {
        $definitions = [
            ['first' => 'Alice', 'last' => 'Rivera', 'email' => 'alice@demo.com', 'rate' => 645],
            ['first' => 'Ben', 'last' => 'Cruz', 'email' => 'ben@demo.com', 'rate' => 580],
            ['first' => 'Clara', 'last' => 'Santos', 'email' => 'clara@demo.com', 'rate' => 720],
            ['first' => 'Dan', 'last' => 'Reyes', 'email' => 'dan@demo.com', 'rate' => 510],
            ['first' => 'Ella', 'last' => 'Mendoza', 'email' => 'ella@demo.com', 'rate' => 690],
        ];

        $employees = [];

        foreach ($definitions as $i => $d) {
            $seq = $i + 2;
            $emp = Employee::firstOrCreate(
                ['employee_number' => "EMP-2026-000{$seq}"],
                [
                    'account_id' => $account->id,
                    'role_id' => $role->id,
                    'username' => "EMP-2026-000{$seq}",
                    'first_name' => $d['first'],
                    'last_name' => $d['last'],
                    'hire_date' => '2026-01-05',
                    'position' => 'regular',
                    'status' => 'active',
                    'current_daily_rate' => $d['rate'],
                ],
            );

            User::firstOrCreate(
                ['email' => $d['email']],
                [
                    'name' => "{$d['first']} {$d['last']}",
                    'password' => bcrypt('password'),
                    'employee_id' => $emp->id,
                ],
            );

            $account->users()->syncWithoutDetaching([$emp->user->id]);

            $employees[] = $emp;
        }

        return $employees;
    }

    private function createSchedules(array $employees): void
    {
        $configs = [
            ['start' => '06:00', 'end' => '15:00', 'rest' => ['sunday']],
            ['start' => '08:00', 'end' => '17:00', 'rest' => ['sunday']],
            ['start' => '07:30', 'end' => '16:30', 'rest' => ['sunday']],
            ['start' => '08:00', 'end' => '17:00', 'rest' => ['sunday']],
            ['start' => '08:00', 'end' => '17:00', 'rest' => ['sunday']],
        ];

        foreach ($employees as $i => $emp) {
            if ($emp->schedules()->count() > 0) {
                continue;
            }

            $c = $configs[$i];
            EmployeeSchedule::create([
                'account_id' => $emp->account_id,
                'employee_id' => $emp->id,
                'schedule_start' => $c['start'],
                'schedule_end' => $c['end'],
                'rest_days' => $c['rest'],
                'effective_from' => '2026-01-05',
            ]);
        }
    }

    private function createAttendance(array $employees, AttendanceService $service): void
    {
        $week1 = $this->weekdays(Carbon::parse('2026-05-11')); // Mon May 11 – Sat May 16
        $week2 = $this->weekdays(Carbon::parse('2026-05-18')); // Mon May 18 – Sat May 23

        // Employee 0 (Alice): 2 weeks, no issues — 06:00-15:00
        foreach ([...$week1, ...$week2] as $day) {
            $this->punchDay($employees[0], $day, '06:00', '15:00', 0);
        }

        // Employee 1 (Ben): 2 weeks, no issues — 08:00-17:00
        foreach ([...$week1, ...$week2] as $day) {
            $this->punchDay($employees[1], $day, '08:00', '17:00', 0);
        }

        // Employee 2 (Clara): 1 full week — 07:30-16:30
        foreach ($week1 as $day) {
            $this->punchDay($employees[2], $day, '07:30', '16:30', 0);
        }

        // Employee 3 (Dan): 1 week with random lates — 08:00-17:00
        // Late amounts: Mon=10min, Tue=0, Wed=25min, Thu=15min, Fri=0, Sat=8min
        $lateMinutes = [10, 0, 25, 15, 0, 8];
        foreach ($week1 as $idx => $day) {
            $late = $lateMinutes[$idx];
            $inTime = Carbon::parse('08:00')->addMinutes($late)->format('H:i');
            $this->punchDay($employees[3], $day, $inTime, '17:00', $late);
        }

        // Employee 4 (Ella): 1 week with absences (absent Wed + Fri) — 08:00-17:00
        $absentDays = [2, 4];
        foreach ($week1 as $idx => $day) {
            if (in_array($idx, $absentDays)) {
                $service->processDailyAttendance($employees[4], $day->toDateString());

                continue;
            }
            $this->punchDay($employees[4], $day, '08:00', '17:00', 0);
        }
    }

    private function weekdays(Carbon $monday): array
    {
        $days = [];

        for ($i = 0; $i < 6; $i++) {
            $days[] = $monday->copy()->addDays($i);
        }

        return $days;
    }

    private function punchDay(Employee $employee, Carbon $date, string $inTime, string $outTime, int $lateMinutes = 0): void
    {
        TimeLog::where('employee_id', $employee->id)->whereDate('punched_at', $date->toDateString())->delete();

        $in = Carbon::parse($date->toDateString().' '.$inTime);
        $lunchOut = Carbon::parse($date->toDateString().' 12:00');
        $lunchIn = Carbon::parse($date->toDateString().' 13:00');
        $out = Carbon::parse($date->toDateString().' '.$outTime);

        TimeLog::create([
            'account_id' => $employee->account_id,
            'employee_id' => $employee->id,
            'type' => 'in',
            'source' => 'self_service',
            'punched_at' => $in,
        ]);

        TimeLog::create([
            'account_id' => $employee->account_id,
            'employee_id' => $employee->id,
            'type' => 'lunch_out',
            'source' => 'self_service',
            'punched_at' => $lunchOut,
        ]);

        TimeLog::create([
            'account_id' => $employee->account_id,
            'employee_id' => $employee->id,
            'type' => 'lunch_in',
            'source' => 'self_service',
            'punched_at' => $lunchIn,
        ]);

        TimeLog::create([
            'account_id' => $employee->account_id,
            'employee_id' => $employee->id,
            'type' => 'out',
            'source' => 'self_service',
            'punched_at' => $out,
        ]);

        app(AttendanceService::class)->processDailyAttendance($employee, $date->toDateString());
    }
}
