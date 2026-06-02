<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\PayrollPeriodItem;
use App\Models\ThirteenthMonthAccrual;
use Carbon\Carbon;

class ThirteenthMonthService
{
    public function updateAccruals(int $accountId, string $periodStart, string $periodEnd, ?int $employeeId = null): void
    {
        $year = Carbon::parse($periodStart)->year;

        $query = PayrollPeriodItem::whereHas('payrollPeriod', function ($q) use ($accountId) {
            $q->where('account_id', $accountId);
        });

        if ($employeeId) {
            $query->where('employee_id', $employeeId);
        }

        $totals = $query->whereYear('created_at', $year)->get()
            ->groupBy('employee_id')
            ->map(fn ($items) => $items->sum('gross_pay'));

        foreach ($totals as $empId => $total) {
            $prorated = round($total / 12, 2);

            ThirteenthMonthAccrual::updateOrCreate(
                ['employee_id' => $empId, 'year' => $year],
                [
                    'account_id' => $accountId,
                    'total_basic_pay' => $total,
                    'prorated_amount' => $prorated,
                ]
            );
        }
    }

    public function getAccrual(Employee $employee, int $year): ?ThirteenthMonthAccrual
    {
        return ThirteenthMonthAccrual::where('employee_id', $employee->id)
            ->where('year', $year)
            ->first();
    }
}
