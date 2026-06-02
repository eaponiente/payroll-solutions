<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\AttendanceCorrectionRequest;
use App\Models\CashAdvance;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\Fine;
use App\Models\LeaveRequest;
use App\Models\OvertimeRequest;
use App\Models\Role;
use App\Models\TimeLog;
use App\Models\User;
use App\Services\AttendanceService;
use App\Services\OvertimeCalculator;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    private array $firstNames = [
        'James', 'Maria', 'John', 'Jennifer', 'Robert',
        'Patricia', 'Michael', 'Linda', 'David', 'Barbara',
        'William', 'Elizabeth', 'Richard', 'Susan', 'Joseph',
        'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
        'Daniel', 'Lisa', 'Matthew', 'Nancy', 'Anthony',
        'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra',
    ];

    private array $lastNames = [
        'Reyes', 'Santos', 'Cruz', 'Garcia', 'Mendoza',
        'Torres', 'Ramos', 'Aquino', 'Dela Cruz', 'Flores',
        'Gonzales', 'Villanueva', 'Castillo', 'Rivera', 'Diaz',
        'Bautista', 'Fernandez', 'Lopez', 'Perez', 'Valdez',
    ];

    public function run(): void
    {
        $account = Account::firstOrFail();
        $service = app(AttendanceService::class);
        $staffRole = Role::where('account_id', $account->id)->where('slug', 'staff')->first();

        $employees = $this->createEmployees($account, $staffRole);
        $this->createData($employees, $account, $service);

        $this->command?->info('Demo data seeded: 30 employees, 2 months attendance.');
    }

    private function createEmployees(Account $account, ?Role $role): array
    {
        $employees = [];
        $hireDate = '2026-01-02';

        for ($i = 0; $i < 10; $i++) {
            $firstName = $this->firstNames[$i];
            $lastName = $this->lastNames[$i % count($this->lastNames)];
            $email = strtolower($firstName.'.'.$lastName).$i.'@demo.com';
            $rate = rand(500, 1200);
            $seq = $i + 20;
            $num = "EMP-2026-0{$seq}";

            $emp = Employee::firstOrCreate(
                ['employee_number' => $num],
                [
                    'account_id' => $account->id,
                    'role_id' => $role?->id,
                    'username' => $num,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'hire_date' => $hireDate,
                    'position' => 'regular',
                    'status' => 'active',
                    'current_daily_rate' => $rate,
                    'sss_number' => "SSS-{$seq}",
                    'philhealth_number' => "PH-{$seq}",
                    'pagibig_number' => "PAG-{$seq}",
                    'tin_number' => "TIN-{$seq}",
                ],
            );

            User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => "{$firstName} {$lastName}",
                    'password' => bcrypt('password'),
                    'employee_id' => $emp->id,
                ],
            );

            $account->users()->syncWithoutDetaching([$emp->user->id]);

            EmployeeSchedule::firstOrCreate(
                ['employee_id' => $emp->id, 'effective_from' => $hireDate],
                [
                    'account_id' => $account->id,
                    'schedule_start' => '08:00',
                    'schedule_end' => '17:00',
                    'rest_days' => ['sunday'],
                    'effective_from' => $hireDate,
                ],
            );

            $employees[] = $emp;
        }

        return $employees;
    }

    private function createData(array $employees, Account $account, AttendanceService $service): void
    {
        $startDate = Carbon::parse('2026-04-01');
        $endDate = Carbon::parse('2026-05-31');
        $current = $startDate->copy();
        $lateEmployees = array_slice($employees, 0, 8);
        $absentEmployees = array_slice($employees, 8, 4);
        $otEmployees = array_slice($employees, 12, 6);
        $leaveEmployees = array_slice($employees, 18, 4);
        $caEmployees = array_slice($employees, 22, 3);
        $fineEmployees = array_slice($employees, 25, 4);
        $correctionEmployees = array_slice($employees, 27, 3);
        $undertimeEmployees = array_slice($employees, 4, 4);
        $earlyEmployees = array_slice($employees, 10, 4);

        while ($current->lte($endDate)) {
            $dayOfWeek = (int) $current->format('N');

            if ($dayOfWeek >= 6) {
                $current->addDay();

                continue;
            }

            foreach ($employees as $ei => $emp) {
                $absent = in_array($emp, $absentEmployees, true) && rand(0, 9) === 0;
                $isAbsentToday = $absent && $current->day >= 15;

                $late = in_array($emp, $lateEmployees, true) && rand(0, 3) === 0;
                $lateMin = $late ? rand(5, 25) : 0;

                $isUndertime = in_array($emp, $undertimeEmployees, true) && rand(0, 4) === 0;
                $undertoneMin = $isUndertime ? rand(30, 90) : 0;

                $isEarly = in_array($emp, $earlyEmployees, true) && rand(0, 3) === 0;
                $earlyMin = $isEarly ? rand(15, 45) : 0;

                $punchDate = $current->copy();
                $dateStr = $punchDate->toDateString();
                $inTime = $this->manilaTime($dateStr, '08:00')->addMinutes($lateMin)->subMinutes($earlyMin);
                $lunchOut = $this->manilaTime($dateStr, '12:00')->addMinutes(rand(0, 15));
                $lunchIn = $this->manilaTime($dateStr, '13:00')->addMinutes(rand(0, 15));
                $outTime = $this->manilaTime($dateStr, '17:00')->addMinutes(rand(0, 10))->subMinutes($undertoneMin);

                $employeeId = $emp->id;
                $accountId = $emp->account_id;

                TimeLog::where('employee_id', $employeeId)
                    ->whereDate('punched_at', $punchDate->toDateString())
                    ->delete();

                if ($isAbsentToday) {
                    $service->processDailyAttendance($emp, $punchDate->toDateString());

                    continue;
                }

                TimeLog::insert([
                    [
                        'account_id' => $accountId,
                        'employee_id' => $employeeId,
                        'type' => 'in',
                        'source' => 'self_service',
                        'punched_at' => $inTime,
                        'created_at' => $inTime,
                    ],
                    [
                        'account_id' => $accountId,
                        'employee_id' => $employeeId,
                        'type' => 'lunch_out',
                        'source' => 'self_service',
                        'punched_at' => $lunchOut,
                        'created_at' => $lunchOut,
                    ],
                    [
                        'account_id' => $accountId,
                        'employee_id' => $employeeId,
                        'type' => 'lunch_in',
                        'source' => 'self_service',
                        'punched_at' => $lunchIn,
                        'created_at' => $lunchIn,
                    ],
                    [
                        'account_id' => $accountId,
                        'employee_id' => $employeeId,
                        'type' => 'out',
                        'source' => 'self_service',
                        'punched_at' => $outTime,
                        'created_at' => $outTime,
                    ],
                ]);

                $service->processDailyAttendance($emp, $punchDate->toDateString());
            }

            $current->addDay();
        }

        foreach ($otEmployees as $otEmp) {
            $dates = [];
            for ($i = 0; $i < 4; $i++) {
                $d = $startDate->copy()->addDays(rand(1, 60));
                if ($d->isWeekday() && ! in_array($d->toDateString(), $dates)) {
                    $dates[] = $d->toDateString();
                }
            }

            foreach ($dates as $date) {
                $multiplier = OvertimeCalculator::multiplier('regular_day');
                OvertimeRequest::firstOrCreate(
                    ['employee_id' => $otEmp->id, 'date' => $date],
                    [
                        'account_id' => $otEmp->account_id,
                        'requested_minutes' => rand(60, 180),
                        'reason' => 'Additional workload',
                        'shift_type' => 'regular_day',
                        'status' => 'approved',
                        'approved_by' => $otEmp->id,
                        'approved_at' => now(),
                        'multiplier' => $multiplier,
                    ],
                );
            }
        }

        foreach ($leaveEmployees as $leaveEmp) {
            $dates = [];
            for ($i = 0; $i < 3; $i++) {
                $d = $startDate->copy()->addDays(rand(1, 60));
                if ($d->isWeekday() && ! in_array($d->toDateString(), $dates)) {
                    $dates[] = $d->toDateString();
                }
            }

            $types = ['vacation', 'sick', 'emergency'];
            foreach ($dates as $j => $date) {
                LeaveRequest::firstOrCreate(
                    ['employee_id' => $leaveEmp->id, 'date' => $date],
                    [
                        'account_id' => $leaveEmp->account_id,
                        'leave_type' => $types[$j % 3],
                        'duration' => 'full_day',
                        'is_paid' => $types[$j % 3] !== 'unpaid',
                        'reason' => ucfirst($types[$j % 3]).' leave',
                        'status' => 'approved',
                        'approved_by' => $leaveEmp->id,
                        'approved_at' => now(),
                    ],
                );
            }
        }

        foreach ($correctionEmployees as $corrEmp) {
            $dates = [];
            for ($i = 0; $i < 2; $i++) {
                $d = $startDate->copy()->addDays(rand(1, 60));
                if ($d->isWeekday() && ! in_array($d->toDateString(), $dates)) {
                    $dates[] = $d->toDateString();
                }
            }

            foreach ($dates as $date) {
                AttendanceCorrectionRequest::firstOrCreate(
                    ['employee_id' => $corrEmp->id, 'date' => $date, 'correction_type' => 'missed_punch_in'],
                    [
                        'account_id' => $corrEmp->account_id,
                        'requested_in' => '08:00',
                        'reason' => 'Forgot to punch in',
                        'status' => 'approved',
                        'reviewed_by' => $corrEmp->id,
                        'reviewed_at' => now(),
                    ],
                );
            }
        }

        foreach ($caEmployees as $caEmp) {
            CashAdvance::firstOrCreate(
                ['employee_id' => $caEmp->id, 'status' => 'approved'],
                [
                    'account_id' => $caEmp->account_id,
                    'amount' => rand(1000, 5000),
                    'remaining_balance' => rand(500, 2000),
                    'reason' => 'Financial assistance',
                    'requested_by' => $caEmp->id,
                    'approved_by' => $caEmp->id,
                    'approved_at' => now(),
                ],
            );
        }

        foreach ($fineEmployees as $fineEmp) {
            $fineTypes = ['Late', 'Uniform', 'No ID', 'Attendance'];
            $dates = [];
            for ($i = 0; $i < 2; $i++) {
                $d = $startDate->copy()->addDays(rand(1, 60));
                if ($d->isWeekday() && ! in_array($d->toDateString(), $dates)) {
                    $dates[] = $d->toDateString();
                }
            }

            foreach ($dates as $j => $date) {
                Fine::firstOrCreate(
                    ['employee_id' => $fineEmp->id, 'date' => $date, 'fine_type' => $fineTypes[$j % 4]],
                    [
                        'account_id' => $fineEmp->account_id,
                        'amount' => rand(50, 500),
                        'reason' => "Violation: {$fineTypes[$j % 4]}",
                        'marked_by' => $fineEmp->id,
                    ],
                );
            }
        }
    }

    private function manilaTime(string $date, string $time): Carbon
    {
        return Carbon::parse("{$date} {$time}", 'Asia/Manila')->setTimezone('UTC');
    }
}
