<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\AttendanceCorrectionRequest;
use App\Models\CashAdvance;
use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use App\Models\Fine;
use App\Models\LeaveRequest;
use App\Models\OvertimeRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Shift;
use App\Models\TimeLog;
use App\Models\User;
use App\Services\AttendanceService;
use App\Services\OvertimeCalculator;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DemoShiftSeeder extends Seeder
{
    public function run(): void
    {
        $account = Account::firstOrFail();
        $service = app(AttendanceService::class);

        $account->update(['schedule_type' => 'shifting']);

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

        $shifts = $this->ensureShifts($account);
        $employees = $this->createEmployees($account, $role);
        $this->assignShifts($employees, $shifts);
        $this->createAttendance($employees, $service);
        $this->createOvertimeRequests($employees);
        $this->createLeaveRequests($employees);
        $this->createCorrectionRequests($employees);
        $this->createCashAdvances($employees, $account);
        $this->createFines($employees, $account);

        $this->command?->info('Demo shift attendance data seeded with overtime, leaves, corrections, cash advances, and fines.');
    }

    private function ensureShifts(Account $account): array
    {
        if (Shift::count() > 0) {
            return Shift::where('account_id', $account->id)->orderBy('sort_order')->get()->all();
        }

        $shiftData = [
            ['name' => 'Morning', 'start_time' => '06:00', 'end_time' => '14:00', 'night_differential' => false, 'rest_days' => ['sun'], 'sort_order' => 0],
            ['name' => 'Afternoon', 'start_time' => '14:00', 'end_time' => '22:00', 'night_differential' => false, 'rest_days' => ['sun'], 'sort_order' => 1],
            ['name' => 'Graveyard', 'start_time' => '22:00', 'end_time' => '06:00', 'night_differential' => true, 'rest_days' => ['sat', 'sun'], 'sort_order' => 2],
        ];

        $shifts = [];
        foreach ($shiftData as $data) {
            $shifts[] = Shift::create(['account_id' => $account->id, ...$data]);
        }

        return $shifts;
    }

    private function createEmployees(Account $account, Role $role): array
    {
        $definitions = [
            ['first' => 'Ana', 'last' => 'Dela Cruz', 'email' => 'ana@demo.com', 'rate' => 645, 'sss' => 'SSS-0101', 'ph' => 'PH-0101', 'pag' => 'PAG-0101', 'tin' => 'TIN-0101'],
            ['first' => 'Ben', 'last' => 'Garcia', 'email' => 'beng@demo.com', 'rate' => 580, 'sss' => 'SSS-0102', 'ph' => 'PH-0102', 'pag' => 'PAG-0102', 'tin' => 'TIN-0102'],
            ['first' => 'Carla', 'last' => 'Reyes', 'email' => 'carla@demo.com', 'rate' => 720, 'sss' => 'SSS-0103', 'ph' => 'PH-0103', 'pag' => 'PAG-0103', 'tin' => 'TIN-0103'],
            ['first' => 'Diego', 'last' => 'Santos', 'email' => 'diego@demo.com', 'rate' => 510, 'sss' => 'SSS-0104', 'ph' => 'PH-0104', 'pag' => 'PAG-0104', 'tin' => 'TIN-0104'],
            ['first' => 'Elena', 'last' => 'Torres', 'email' => 'elena@demo.com', 'rate' => 690, 'sss' => 'SSS-0105', 'ph' => 'PH-0105', 'pag' => 'PAG-0105', 'tin' => 'TIN-0105'],
        ];

        $employees = [];

        foreach ($definitions as $i => $d) {
            $seq = $i + 10;
            $emp = Employee::firstOrCreate(
                ['employee_number' => "EMP-2026-00{$seq}"],
                [
                    'account_id' => $account->id,
                    'role_id' => $role->id,
                    'username' => "EMP-2026-00{$seq}",
                    'first_name' => $d['first'],
                    'last_name' => $d['last'],
                    'hire_date' => '2026-01-05',
                    'position' => 'regular',
                    'status' => 'active',
                    'current_daily_rate' => $d['rate'],
                    'sss_number' => $d['sss'],
                    'philhealth_number' => $d['ph'],
                    'pagibig_number' => $d['pag'],
                    'tin_number' => $d['tin'],
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

    private function assignShifts(array $employees, array $shifts): void
    {
        $weekStart = Carbon::parse('2026-06-01')->startOfWeek(Carbon::MONDAY);
        $shiftPatterns = [
            0, 0, 0, 0, 0, 1, 1,
            1, 1, 1, 1, 0, 2, 2,
            2, 2, 2, 2, 0, 0, 0,
            0, 1, 1, 0, 2, 1, 0,
            1, 0, 2, 0, 1, 0, 2,
        ];

        foreach ($employees as $ei => $emp) {
            for ($d = 0; $d < 7; $d++) {
                $date = $weekStart->copy()->addDays($d);
                $patternIdx = $ei * 7 + $d;
                $shiftIdx = $shiftPatterns[$patternIdx] % count($shifts);

                EmployeeShiftAssignment::updateOrCreate(
                    ['employee_id' => $emp->id, 'date' => $date->toDateString()],
                    ['account_id' => $emp->account_id, 'shift_id' => $shifts[$shiftIdx]->id],
                );
            }
        }
    }

    private function createAttendance(array $employees, AttendanceService $service): void
    {
        $weekStart = Carbon::parse('2026-06-01')->startOfWeek(Carbon::MONDAY);

        $shiftTimes = [
            ['in' => '06:00', 'out' => '14:00'],
            ['in' => '14:00', 'out' => '22:00'],
            ['in' => '22:00', 'out' => '06:00'],
        ];

        $assignments = EmployeeShiftAssignment::whereIn('employee_id', array_map(fn ($e) => $e->id, $employees))
            ->whereBetween('date', [$weekStart->toDateString(), $weekStart->copy()->addDays(6)->toDateString()])
            ->with('shift')
            ->get()
            ->groupBy('employee_id');

        $lateDays = [
            0 => [2, 4],
            1 => [1],
            2 => [],
            3 => [0, 3, 5],
            4 => [],
        ];

        $absentDays = [
            0 => [],
            1 => [],
            2 => [3],
            3 => [],
            4 => [1, 5],
        ];

        for ($d = 0; $d < 7; $d++) {
            $date = $weekStart->copy()->addDays($d);
            $dayOfWeek = (int) $date->format('N') - 1;

            foreach ($employees as $ei => $emp) {
                $empAssignments = $assignments->get($emp->id, collect());
                $assignment = $empAssignments->firstWhere(fn ($a) => $a->date->toDateString() === $date->toDateString());

                if (! $assignment || ! $assignment->shift) {
                    $service->processDailyAttendance($emp, $date->toDateString());

                    continue;
                }

                $shift = $assignment->shift;
                $restDays = array_map('strtolower', $shift->rest_days);
                $dayName = strtolower($date->format('D'));

                if (in_array($dayName, $restDays)) {
                    $service->processDailyAttendance($emp, $date->toDateString());

                    continue;
                }

                $absentForEmployee = $absentDays[$ei] ?? [];
                if (in_array($d, $absentForEmployee)) {
                    $service->processDailyAttendance($emp, $date->toDateString());

                    continue;
                }

                $shiftType = $shift->name === 'Morning' ? 0 : ($shift->name === 'Afternoon' ? 1 : 2);
                $times = $shiftTimes[$shiftType];

                $inTime = $times['in'];
                $lateMinutes = 0;

                $lates = $lateDays[$ei] ?? [];
                if (in_array($d, $lates)) {
                    $lateMinutes = rand(10, 30);
                    $inCarbon = Carbon::parse($inTime)->addMinutes($lateMinutes);
                    $inTime = $inCarbon->format('H:i');
                }

                $this->punchDay($emp, $date, $inTime, $times['out'], $shift->night_differential, $lateMinutes);
            }
        }
    }

    private function punchDay(Employee $employee, Carbon $date, string $inTime, string $outTime, bool $nightDiff, int $lateMinutes = 0): void
    {
        TimeLog::where('employee_id', $employee->id)->whereDate('punched_at', $date->toDateString())->delete();

        $in = Carbon::parse($date->toDateString().' '.$inTime);

        if ($nightDiff && str_contains($outTime, '06:00')) {
            $out = Carbon::parse($date->copy()->addDay()->toDateString().' '.$outTime);
        } else {
            $out = Carbon::parse($date->toDateString().' '.$outTime);
        }

        $middle = $in->copy()->addHours(4);
        $lunchOut = Carbon::parse($middle->toDateString().' '.$middle->format('H:i'));
        $lunchIn = $lunchOut->copy()->addHour();

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

    private function createOvertimeRequests(array $employees): void
    {
        $weekStart = Carbon::parse('2026-06-01')->startOfWeek(Carbon::MONDAY);

        $otData = [
            ['emp' => 0, 'day' => 2, 'minutes' => 120, 'shift_type' => 'regular_day'],
            ['emp' => 1, 'day' => 3, 'minutes' => 90, 'shift_type' => 'rest_day'],
            ['emp' => 3, 'day' => 1, 'minutes' => 60, 'shift_type' => 'regular_day'],
            ['emp' => 4, 'day' => 4, 'minutes' => 180, 'shift_type' => 'regular_holiday'],
        ];

        foreach ($otData as $data) {
            $emp = $employees[$data['emp']];
            $date = $weekStart->copy()->addDays($data['day']);

            $multiplier = OvertimeCalculator::multiplier($data['shift_type']);

            OvertimeRequest::create([
                'account_id' => $emp->account_id,
                'employee_id' => $emp->id,
                'date' => $date->toDateString(),
                'requested_minutes' => $data['minutes'],
                'reason' => 'Additional workload',
                'shift_type' => $data['shift_type'],
                'status' => 'approved',
                'approved_by' => $emp->id,
                'approved_at' => now(),
                'multiplier' => $multiplier,
            ]);
        }
    }

    private function createLeaveRequests(array $employees): void
    {
        $weekStart = Carbon::parse('2026-06-01')->startOfWeek(Carbon::MONDAY);

        $leaveData = [
            ['emp' => 0, 'day' => 5, 'type' => 'vacation', 'duration' => 'full_day', 'paid' => true, 'reason' => 'Family trip'],
            ['emp' => 2, 'day' => 0, 'type' => 'sick', 'duration' => 'full_day', 'paid' => true, 'reason' => 'Doctor appointment'],
            ['emp' => 4, 'day' => 3, 'type' => 'emergency', 'duration' => 'half_day_am', 'paid' => true, 'reason' => 'Family emergency'],
        ];

        foreach ($leaveData as $data) {
            $emp = $employees[$data['emp']];
            $date = $weekStart->copy()->addDays($data['day']);

            LeaveRequest::create([
                'account_id' => $emp->account_id,
                'employee_id' => $emp->id,
                'date' => $date->toDateString(),
                'leave_type' => $data['type'],
                'duration' => $data['duration'],
                'is_paid' => $data['paid'],
                'reason' => $data['reason'],
                'status' => 'approved',
                'approved_by' => $emp->id,
                'approved_at' => now(),
            ]);
        }
    }

    private function createCorrectionRequests(array $employees): void
    {
        $weekStart = Carbon::parse('2026-06-01')->startOfWeek(Carbon::MONDAY);

        $correctionData = [
            ['emp' => 1, 'day' => 0, 'type' => 'missed_punch_in', 'in' => '14:15', 'out' => null, 'reason' => 'Forgot to punch in'],
            ['emp' => 3, 'day' => 4, 'type' => 'time_adjustment', 'in' => '06:05', 'out' => '14:00', 'reason' => 'System error on punch'],
        ];

        foreach ($correctionData as $data) {
            $emp = $employees[$data['emp']];
            $date = $weekStart->copy()->addDays($data['day']);

            AttendanceCorrectionRequest::create([
                'account_id' => $emp->account_id,
                'employee_id' => $emp->id,
                'date' => $date->toDateString(),
                'correction_type' => $data['type'],
                'requested_in' => $data['in'],
                'requested_out' => $data['out'],
                'reason' => $data['reason'],
                'status' => 'approved',
                'reviewed_by' => $emp->id,
                'reviewed_at' => now(),
            ]);
        }
    }

    private function createCashAdvances(array $employees, Account $account): void
    {
        $caData = [
            ['emp' => 1, 'amount' => 2000, 'reason' => 'Medical emergency'],
            ['emp' => 3, 'amount' => 1500, 'reason' => 'Tuition fee payment'],
        ];

        foreach ($caData as $data) {
            $emp = $employees[$data['emp']];

            CashAdvance::create([
                'account_id' => $emp->account_id,
                'employee_id' => $emp->id,
                'amount' => $data['amount'],
                'remaining_balance' => $data['amount'],
                'reason' => $data['reason'],
                'status' => 'approved',
                'requested_by' => $emp->id,
                'approved_by' => $emp->id,
                'approved_at' => now(),
            ]);
        }
    }

    private function createFines(array $employees, Account $account): void
    {
        $weekStart = Carbon::parse('2026-06-01')->startOfWeek(Carbon::MONDAY);

        $fineData = [
            ['emp' => 0, 'day' => 1, 'amount' => 200, 'type' => 'No ID', 'reason' => 'Failed to wear company ID'],
            ['emp' => 1, 'day' => 4, 'amount' => 50, 'type' => 'Late', 'reason' => 'Late arrival'],
            ['emp' => 2, 'day' => 2, 'amount' => 300, 'type' => 'Uniform', 'reason' => 'Incomplete uniform'],
        ];

        foreach ($fineData as $data) {
            $emp = $employees[$data['emp']];
            $date = $weekStart->copy()->addDays($data['day']);

            Fine::create([
                'account_id' => $emp->account_id,
                'employee_id' => $emp->id,
                'date' => $date->toDateString(),
                'fine_type' => $data['type'],
                'amount' => $data['amount'],
                'reason' => $data['reason'],
                'marked_by' => $emp->id,
            ]);
        }
    }
}
