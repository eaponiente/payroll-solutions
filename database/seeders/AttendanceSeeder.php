<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\AttendanceSheet;
use App\Models\Employee;
use App\Models\EmployeeShiftAssignment;
use App\Models\Holiday;
use App\Models\OvertimeRequest;
use App\Models\Shift;
use App\Models\TimeLog;
use App\Services\AttendanceService;
use App\Services\OvertimeCalculator;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AttendanceSeeder extends Seeder
{
    private string $tz = 'Asia/Manila';

    private array $shiftTimes = [
        0 => ['in' => '06:00', 'out' => '14:00'],
        1 => ['in' => '14:00', 'out' => '22:00'],
        2 => ['in' => '22:00', 'out' => '06:00'],
    ];

    public function run(): void
    {
        $account = Account::firstOrFail();
        $account->update(['schedule_type' => 'shifting', 'timezone' => 'Asia/Manila']);

        $shifts = Shift::where('account_id', $account->id)->orderBy('sort_order')->get();
        if ($shifts->isEmpty()) {
            $this->command?->warn('No shifts found. Run ShiftSeeder first.');

            return;
        }

        $employees = Employee::where('account_id', $account->id)
            ->where('status', 'active')
            ->where('current_daily_rate', '>', 0)
            ->orderBy('id')
            ->get();

        if ($employees->isEmpty()) {
            $this->command?->warn('No active employees found.');

            return;
        }

        $week1Start = Carbon::parse('2026-05-11', $this->tz);
        $week2Start = Carbon::parse('2026-05-18', $this->tz);

        $dates = $this->buildDateRange($week1Start, $week2Start);

        $this->cleanExistingData($account, $dates);

        $shiftAssignments = $this->buildShiftAssignments($employees, $shifts, $dates);

        $this->createShiftAssignments($employees, $shifts, $shiftAssignments, $dates);

        $this->createAttendance($employees, $shifts, $shiftAssignments, $dates);

        $this->command?->info('AttendanceSeeder: 2 weeks of flexible-shift attendance with lates, absences, and overtime.');
    }

    private function buildDateRange(Carbon $week1, Carbon $week2): array
    {
        $dates = [];

        for ($d = 0; $d < 6; $d++) {
            $dates[] = $week1->copy()->addDays($d);
        }

        for ($d = 0; $d < 6; $d++) {
            $dates[] = $week2->copy()->addDays($d);
        }

        return $dates;
    }

    private function cleanExistingData(Account $account, array $dates): void
    {
        $dateStrings = array_map(fn ($d) => $d->toDateString(), $dates);
        $empIds = Employee::where('account_id', $account->id)->pluck('id');

        TimeLog::whereIn('employee_id', $empIds)
            ->whereBetween('punched_at', [$dates[0]->startOfDay(), end($dates)->endOfDay()])
            ->delete();

        AttendanceSheet::whereIn('employee_id', $empIds)
            ->whereIn('date', $dateStrings)
            ->delete();

        EmployeeShiftAssignment::whereIn('employee_id', $empIds)
            ->whereIn('date', $dateStrings)
            ->delete();

        OvertimeRequest::whereIn('employee_id', $empIds)
            ->whereIn('date', $dateStrings)
            ->delete();
    }

    private function buildShiftAssignments($employees, $shifts, array $dates): array
    {
        $patterns = [
            [0, 0, 1, 1, 0, 0,  0, 0, 1, 1, 0, 0],
            [1, 1, 0, 0, 1, -1, 1, 1, 0, 0, 1, -1],
            [0, 1, 0, 1, 0, -1, 0, 1, 0, 1, 0, -1],
            [2, 2, 2, -1, 2, 2,  2, 2, 2, -1, 2, 2],
            [0, 0, 0, 0, -1, 0,  0, 0, 0, 0, -1, 0],
            [1, 1, 1, 1, 1, -1, 1, 1, 1, 1, 1, -1],
            [0, 0, 1, 0, 0, 0,  0, 0, 1, 0, 0, 0],
            [1, 0, 1, 0, 1, 0,  1, 0, 1, 0, 1, 0],
        ];

        $result = [];

        foreach ($employees as $empIdx => $employee) {
            $currentPattern = $patterns[$empIdx] ?? $patterns[0];

            foreach ($dates as $dayIdx => $date) {
                $shiftIdx = $currentPattern[$dayIdx] ?? -1;

                if ($shiftIdx >= 0) {
                    $result[$employee->id][$dayIdx] = $shiftIdx;
                }
            }
        }

        return $result;
    }

    private function createShiftAssignments($employees, $shifts, array $assignments, array $dates): void
    {
        foreach ($employees as $empIdx => $employee) {
            $empAssignments = $assignments[$employee->id] ?? [];

            foreach ($empAssignments as $dayIdx => $shiftIdx) {
                EmployeeShiftAssignment::updateOrCreate(
                    ['employee_id' => $employee->id, 'date' => $dates[$dayIdx]->toDateString()],
                    [
                        'account_id' => $employee->account_id,
                        'shift_id' => $shifts[$shiftIdx]->id,
                    ],
                );
            }
        }
    }

    private function createAttendance($employees, $shifts, array $assignments, array $dates): void
    {
        $service = app(AttendanceService::class);

        $lateDays = [
            [2],
            [],
            [],
            [4],
            [],
            [],
            [6],
            [],
        ];

        $absentDays = [
            [],
            [5],
            [],
            [],
            [],
            [],
            [],
            [],
        ];

        $otDays = [
            0 => [4 => 120],
            1 => [3 => 90],
            2 => [8 => 60],
            3 => [2 => 180],
            4 => [5 => 120],
            5 => [8 => 90],
            6 => [1 => 60],
            7 => [0 => 120],
        ];

        foreach ($employees as $empIdx => $employee) {
            $empAssignments = $assignments[$employee->id] ?? [];
            $lates = $lateDays[$empIdx] ?? [];
            $absents = $absentDays[$empIdx] ?? [];
            $ots = $otDays[$empIdx] ?? [];

            foreach ($dates as $dayIdx => $date) {
                if (in_array($dayIdx, $absents)) {
                    $service->processDailyAttendance($employee, $date->toDateString());

                    continue;
                }

                if (! isset($empAssignments[$dayIdx])) {
                    $service->processDailyAttendance($employee, $date->toDateString());

                    continue;
                }

                $shiftIdx = $empAssignments[$dayIdx];
                $shift = $shifts[$shiftIdx];
                $times = $this->shiftTimes[$shiftIdx];

                $inTime = $times['in'];
                $lateMinutes = 0;

                if (in_array($dayIdx, $lates)) {
                    $lateMinutes = rand(10, 30);
                    $inCarbon = Carbon::parse($inTime, $this->tz)->addMinutes($lateMinutes);
                    $inTime = $inCarbon->format('H:i');
                }

                $outTime = $times['out'];

                $otMinutes = $ots[$dayIdx] ?? 0;

                $this->punchDay(
                    $employee,
                    $date,
                    $inTime,
                    $outTime,
                    $shift->night_differential,
                    $otMinutes,
                );

                if ($otMinutes > 0) {
                    $shiftType = $this->isHoliday($date->toDateString())
                        ? 'regular_holiday'
                        : 'regular_day';
                    $multiplier = OvertimeCalculator::multiplier($shiftType);

                    OvertimeRequest::firstOrCreate(
                        [
                            'employee_id' => $employee->id,
                            'date' => $date->toDateString(),
                        ],
                        [
                            'account_id' => $employee->account_id,
                            'requested_minutes' => $otMinutes,
                            'reason' => 'Additional workload',
                            'shift_type' => $shiftType,
                            'status' => 'approved',
                            'approved_by' => $employee->id,
                            'approved_at' => now(),
                            'multiplier' => $multiplier,
                        ],
                    );
                }
            }
        }
    }

    private function punchDay(Employee $employee, Carbon $date, string $inTime, string $outTime, bool $nightDiff, int $otMinutes = 0): void
    {
        $in = Carbon::parse($date->toDateString().' '.$inTime, $this->tz);

        if ($nightDiff && str_contains($outTime, '06:00')) {
            $out = Carbon::parse($date->copy()->addDay()->toDateString().' '.$outTime, $this->tz);
        } else {
            $out = Carbon::parse($date->toDateString().' '.$outTime, $this->tz);
        }

        if ($otMinutes > 0) {
            $out->addMinutes($otMinutes);
        }

        $middle = $in->copy()->addHours(4);
        $lunchOut = Carbon::parse($middle->toDateString().' '.$middle->format('H:i'), $this->tz);
        $lunchIn = $lunchOut->copy()->addHour();

        $logs = [
            ['type' => 'in', 'punched_at' => $in],
            ['type' => 'lunch_out', 'punched_at' => $lunchOut],
            ['type' => 'lunch_in', 'punched_at' => $lunchIn],
            ['type' => 'out', 'punched_at' => $out],
        ];

        foreach ($logs as $log) {
            TimeLog::create([
                'account_id' => $employee->account_id,
                'employee_id' => $employee->id,
                'type' => $log['type'],
                'source' => 'self_service',
                'punched_at' => $log['punched_at'],
            ]);
        }

        app(AttendanceService::class)->processDailyAttendance($employee, $date->toDateString());
    }

    private function isHoliday(string $date): bool
    {
        static $holidays = null;

        if ($holidays === null) {
            $holidays = Holiday::where('account_id', Account::first()->id)
                ->pluck('date')
                ->map->toDateString()
                ->toArray();
        }

        return in_array($date, $holidays);
    }
}
