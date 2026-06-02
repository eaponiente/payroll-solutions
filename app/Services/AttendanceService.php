<?php

namespace App\Services;

use App\Context\TenantContext;
use App\Models\AttendanceSheet;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\Holiday;
use App\Models\OvertimeRequest;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class AttendanceService
{
    public function processDailyAttendance(Employee $employee, string $date): AttendanceSheet
    {
        $dateObj = Carbon::parse($date);
        $tz = $employee->account->timezone ?? 'UTC';

        $dayStart = Carbon::parse($date, $tz)->startOfDay()->setTimezone('UTC');
        $dayEnd = Carbon::parse($date, $tz)->endOfDay()->setTimezone('UTC');

        $timeLogs = $employee->timeLogs()
            ->whereBetween('punched_at', [$dayStart, $dayEnd])
            ->orderBy('punched_at')
            ->get()
            ->groupBy(fn ($log) => $log->type);

        $scheduleData = $this->getScheduleForDate($employee, $dateObj);
        $holiday = Holiday::whereDate('date', $dateObj->toDateString())->first();

        $sheet = AttendanceSheet::where('employee_id', $employee->id)
            ->whereDate('date', $dateObj->toDateString())
            ->first();

        $data = $this->buildSheetData($employee, $scheduleData, $holiday, $timeLogs, $dateObj);

        if ($sheet) {
            $sheet->update($data);
        } else {
            $data['account_id'] = TenantContext::id() ?? $employee->account_id;
            $data['employee_id'] = $employee->id;
            $data['date'] = $dateObj->toDateString();
            $sheet = AttendanceSheet::create($data);
        }

        return $sheet;
    }

    public function processDailyPay(AttendanceSheet $sheet): AttendanceSheet
    {
        $employee = $sheet->employee;
        $dailyRate = (float) $employee->current_daily_rate;
        $hourlyRate = $dailyRate / 8;
        $date = Carbon::parse($sheet->date);
        $tz = $employee->account->timezone ?? 'UTC';

        $holiday = Holiday::whereDate('date', $date->toDateString())->first();
        $scheduleData = $this->getScheduleForDate($employee, $date);

        $data = [
            'gross_pay' => 0,
            'late_deduction' => 0,
            'undertime_deduction' => 0,
            'overtime_pay' => 0,
            'holiday_pay' => 0,
            'holiday_pay_percent' => null,
            'day_before_present' => null,
            'night_differential_pay' => 0,
            'night_differential_hours' => 0,
        ];

        if (! $sheet->is_present) {
            if ($holiday && $holiday->isRegular()) {
                $payData = $this->computeHolidayPayData($employee, $holiday, false, $date);
                $data['holiday_pay'] = $payData['amount'];
                $data['holiday_pay_percent'] = $payData['percent'];
                $data['day_before_present'] = $payData['dayBeforePresent'];
                $data['gross_pay'] = $payData['amount'];
            }

            $sheet->update($data);

            return $sheet->fresh();
        }

        $lateMinutes = (int) $sheet->late_minutes;
        $undertimeMinutes = (float) $sheet->undertime_minutes;
        $regularHours = (float) $sheet->regular_hours;
        $overtimeMinutes = (int) $sheet->overtime_minutes;

        $data['late_deduction'] = $this->computeLateDeduction($lateMinutes, $hourlyRate);
        $data['undertime_deduction'] = ($undertimeMinutes / 60) * $hourlyRate;

        if ($overtimeMinutes > 0 && $sheet->ot_multiplier) {
            $data['overtime_pay'] = $this->computeOvertimePay($overtimeMinutes, $dailyRate, (float) $sheet->ot_multiplier);
        }

        $basePay = $lateMinutes > 0
            ? $dailyRate - $data['late_deduction']
            : ($hourlyRate * $regularHours);

        if ($holiday && $sheet->holiday_worked) {
            $payData = $this->computeHolidayPayData($employee, $holiday, true, $date);
            $data['holiday_pay'] = $payData['amount'];
            $data['holiday_pay_percent'] = $payData['percent'];
        }

        $data['gross_pay'] = $basePay + $data['overtime_pay'] + $data['holiday_pay'];

        if ($scheduleData['night_differential'] && $sheet->time_in && $sheet->time_out) {
            $nightDiff = $this->computeNightDifferentialPay($hourlyRate, $sheet->time_in, $sheet->time_out);
            $data['night_differential_pay'] = $nightDiff['pay'];
            $data['night_differential_hours'] = $nightDiff['hours'];
            $data['gross_pay'] += $nightDiff['pay'];
        }

        $sheet->update($data);

        return $sheet->fresh();
    }

    public function computeLateMinutes(CarbonInterface $punchIn, CarbonInterface $scheduleStart, CarbonInterface $date): int
    {
        $start = $scheduleStart->copy()->setDateFrom($date);

        return (int) max(0, $start->diffInMinutes($punchIn, false));
    }

    public function computeLateDeduction(int $lateMinutes, float $hourlyRate): float
    {
        if ($lateMinutes === 0) {
            return 0;
        }
        if ($lateMinutes < 20) {
            return $lateMinutes * 5;
        }
        if ($lateMinutes < 60) {
            return 100;
        }

        return 100 + (floor($lateMinutes / 60) * $hourlyRate);
    }

    public function computeOvertimePay(int $otMinutes, float $dailyRate, ?float $multiplier): float
    {
        if ($otMinutes === 0 || $multiplier === null) {
            return 0;
        }

        $hourlyRate = $dailyRate / 8;
        $hours = $otMinutes / 60;

        return round($hours * $hourlyRate * $multiplier, 2);
    }

    private function buildSheetData(
        Employee $employee,
        array $scheduleData,
        ?Holiday $holiday,
        Collection $timeLogs,
        CarbonInterface $date,
    ): array {
        $tz = $employee->account->timezone ?? 'UTC';
        $scheduleStartTime = Carbon::parse($scheduleData['start_time'], $tz);
        $scheduleEndTime = Carbon::parse($scheduleData['end_time'], $tz);

        $data = [
            'account_id' => TenantContext::id() ?? $employee->account_id,
            'employee_id' => $employee->id,
            'date' => $date->toDateString(),
            'schedule_start' => $scheduleStartTime->copy()->setDateFrom($date)->setTimezone('UTC'),
            'schedule_end' => $scheduleEndTime->copy()->setDateFrom($date)->setTimezone('UTC'),
            'is_rest_day' => $scheduleData['is_rest_day'] ?? false,
            'is_holiday' => $holiday !== null,
            'holiday_type' => $holiday?->type,
            'is_present' => false,
            'late_minutes' => 0,
            'undertime_minutes' => 0,
            'overtime_minutes' => 0,
            'regular_hours' => 0,
            'gross_pay' => 0,
            'late_deduction' => 0,
            'undertime_deduction' => 0,
            'overtime_pay' => 0,
            'holiday_pay' => 0,
        ];

        $punchIn = $timeLogs->get('in', collect())->sortBy('punched_at')->first();
        if (! $punchIn) {
            return $data;
        }

        $data['time_in'] = $punchIn->punched_at;
        $data['is_present'] = true;

        $punchOut = $timeLogs->get('out', collect())->sortByDesc('punched_at')->first();
        $lateMinutes = $this->computeLateMinutes($punchIn->punched_at, $scheduleStartTime, $date);
        $data['late_minutes'] = $lateMinutes;

        if ($punchOut) {
            $data['time_out'] = $punchOut->punched_at;

            $lunchOut = $timeLogs->get('lunch_out', collect())->sortBy('punched_at')->first();
            $lunchIn = $timeLogs->get('lunch_in', collect())->sortByDesc('punched_at')->first();
            $lunchDeductionMinutes = 0;

            if ($lunchOut && $lunchIn) {
                $data['lunch_out'] = $lunchOut->punched_at;
                $data['lunch_in'] = $lunchIn->punched_at;
                $actualLunch = $lunchIn->punched_at->diffInMinutes($lunchOut->punched_at);
                $lunchDeductionMinutes = max(0, $actualLunch - 60);
            } elseif ($punchIn->punched_at->diffInHours($punchOut->punched_at) >= 5) {
                $lunchWindowStart = Carbon::parse('11:00', $tz)->setDateFrom($date);
                $lunchWindowEnd = Carbon::parse('14:00', $tz)->setDateFrom($date);
                if ($punchIn->punched_at->lte($lunchWindowStart) && $punchOut->punched_at->gte($lunchWindowEnd)) {
                    $lunchDeductionMinutes = 60;
                }
            }

            $scheduleStartDateTime = $scheduleStartTime->copy()->setDateFrom($date);
            $scheduleEndDateTime = $scheduleEndTime->copy()->setDateFrom($date);

            $cappedIn = $punchIn->punched_at->lt($scheduleStartDateTime)
                ? $scheduleStartDateTime
                : $punchIn->punched_at;

            $cappedOut = $punchOut->punched_at->gt($scheduleEndDateTime)
                ? $scheduleEndDateTime
                : $punchOut->punched_at;

            $totalWorkMinutes = max(0, $cappedIn->diffInMinutes($cappedOut) - $lunchDeductionMinutes - $lateMinutes);
            $regularHours = round($totalWorkMinutes / 60, 2);

            $undertimeMinutes = max(0, $scheduleEndDateTime->diffInMinutes($cappedOut));

            $overtimeApproved = OvertimeRequest::where('employee_id', $employee->id)
                ->whereDate('date', $date->toDateString())
                ->where('status', 'approved')
                ->first();

            $actualOTMinutes = (int) max(0, $punchOut->punched_at->diffInMinutes($scheduleEndDateTime));
            $otMinutes = $overtimeApproved
                ? min($actualOTMinutes, $overtimeApproved->requested_minutes)
                : 0;

            $data['regular_hours'] = $regularHours;
            $data['undertime_minutes'] = $undertimeMinutes + $lunchDeductionMinutes;
            $data['overtime_minutes'] = $otMinutes;

            if ($overtimeApproved) {
                $data['overtime_approved_minutes'] = $overtimeApproved->requested_minutes;
                $data['ot_multiplier'] = $overtimeApproved->multiplier;
            }

            if ($holiday) {
                $data['holiday_worked'] = true;
            }
        }

        return $data;
    }

    private function computeHolidayPayData(Employee $employee, ?Holiday $holiday, bool $worked, Carbon $date): array
    {
        $result = ['amount' => 0.0, 'percent' => null, 'worked' => false, 'dayBeforePresent' => null];

        if (! $holiday) {
            return $result;
        }

        $dailyRate = (float) $employee->current_daily_rate;

        if ($worked) {
            $result['worked'] = true;
            if ($holiday->isRegular()) {
                $result['amount'] = $dailyRate * 2;
                $result['percent'] = 200;
            } elseif ($holiday->isSpecial()) {
                $result['amount'] = $dailyRate * 1.3;
                $result['percent'] = 130;
            }
        } elseif ($holiday->isRegular()) {
            $dayBeforePresent = $this->checkDayBeforePresent($employee, $date);
            $result['dayBeforePresent'] = $dayBeforePresent;
            if ($dayBeforePresent) {
                $result['amount'] = $dailyRate;
                $result['percent'] = 100;
            }
        }

        return $result;
    }

    private function checkDayBeforePresent(Employee $employee, Carbon $holidayDate): bool
    {
        $checkDate = $holidayDate->copy()->subDay();
        $isShifting = $employee->account->schedule_type === 'shifting';

        for ($i = 0; $i < 7; $i++) {
            $dayName = strtolower($checkDate->format('l'));
            $isSunday = $dayName === 'sunday';

            if ($isShifting) {
                $scheduleData = $this->getScheduleForDate($employee, $checkDate);
                $isRestDay = $scheduleData['is_rest_day'];
            } else {
                $isRestDay = EmployeeSchedule::where('employee_id', $employee->id)
                    ->whereDate('effective_from', '<=', $checkDate->toDateString())
                    ->where(function ($q) use ($checkDate) {
                        $q->whereNull('effective_to')
                            ->orWhereDate('effective_to', '>=', $checkDate->toDateString());
                    })
                    ->whereJsonContains('rest_days', $dayName)
                    ->exists();
            }

            $isHoliday = Holiday::whereDate('date', $checkDate->toDateString())->exists();

            if ($isSunday || $isRestDay || $isHoliday) {
                $checkDate->subDay();

                continue;
            }

            return AttendanceSheet::where('employee_id', $employee->id)
                ->whereDate('date', $checkDate->toDateString())
                ->where('is_present', true)
                ->exists();
        }

        return false;
    }

    private function isRestDay(EmployeeSchedule|array $schedule, Carbon $date): bool
    {
        $dayName = strtolower($date->format('l'));

        if (is_array($schedule)) {
            return $schedule['is_rest_day'] ?? false;
        }

        return in_array($dayName, array_map('strtolower', $schedule->rest_days));
    }

    private function getScheduleForDate(Employee $employee, Carbon $date): array
    {
        $defaults = ['start_time' => '08:00', 'end_time' => '17:00', 'night_differential' => false, 'is_rest_day' => false];

        if ($employee->account->schedule_type === 'shifting') {
            $assignment = $employee->shiftAssignments()
                ->whereDate('date', $date->toDateString())
                ->with('shift')
                ->first();

            if ($assignment && $assignment->shift) {
                $dayName = strtolower($date->format('l'));

                return [
                    'start_time' => $assignment->shift->start_time->format('H:i'),
                    'end_time' => $assignment->shift->end_time->format('H:i'),
                    'night_differential' => $assignment->shift->night_differential,
                    'shift_id' => $assignment->shift->id,
                    'is_rest_day' => in_array($dayName, array_map('strtolower', $assignment->shift->rest_days)),
                ];
            }

            return array_merge($defaults, ['is_rest_day' => true]);
        }

        $schedule = EmployeeSchedule::where('employee_id', $employee->id)
            ->whereDate('effective_from', '<=', $date->toDateString())
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_to')
                    ->orWhereDate('effective_to', '>=', $date->toDateString());
            })
            ->first();

        if ($schedule) {
            $dayName = strtolower($date->format('l'));

            return [
                'start_time' => $schedule->schedule_start->format('H:i'),
                'end_time' => $schedule->schedule_end->format('H:i'),
                'night_differential' => false,
                'shift_id' => null,
                'is_rest_day' => in_array($dayName, array_map('strtolower', $schedule->rest_days)),
            ];
        }

        return $defaults;
    }

    private function computeNightDifferentialPay(float $hourlyRate, Carbon $punchIn, Carbon $punchOut): array
    {
        $nightStart = Carbon::parse('22:00')->setDateFrom($punchIn);
        $nightEnd = Carbon::parse('06:00')->setDateFrom($punchIn)->addDay();

        $overlapStart = $punchIn->max($nightStart);
        $overlapEnd = $punchOut->min($nightEnd);

        if ($overlapStart->gte($overlapEnd)) {
            return ['hours' => 0.0, 'pay' => 0.0];
        }

        $nightHours = $overlapStart->diffInMinutes($overlapEnd) / 60.0;
        $nightPay = round($nightHours * $hourlyRate * 0.10, 2);

        return ['hours' => round($nightHours, 2), 'pay' => $nightPay];
    }
}
