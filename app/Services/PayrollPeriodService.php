<?php

namespace App\Services;

use App\Models\CompanyConfiguration;
use App\Models\DeMinimisBenefitEntry;
use App\Models\Employee;
use App\Models\PayrollPeriod;
use App\Models\PayrollPeriodItem;
use App\Models\RetroactivePayment;
use App\Models\SssContributionBracket;
use Illuminate\Support\Facades\DB;

class PayrollPeriodService
{
    public function __construct(
        private ?PayrollLedgerService $ledger = null,
    ) {
        $this->ledger = $ledger ?? app(PayrollLedgerService::class);
    }

    public function generate(string $periodStart, string $periodEnd, int $accountId, int $generatedBy): PayrollPeriod
    {
        return DB::transaction(function () use ($periodStart, $periodEnd, $accountId) {
            $payrollPeriod = PayrollPeriod::create([
                'account_id' => $accountId,
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'status' => 'draft',
            ]);

            $employees = Employee::where('account_id', $accountId)
                ->where('status', 'active')
                ->get();

            foreach ($employees as $employee) {
                $sheets = $employee->attendanceSheets()
                    ->whereDate('date', '>=', $periodStart)
                    ->whereDate('date', '<=', $periodEnd)
                    ->lockForUpdate()
                    ->get();

                foreach ($sheets as $sheet) {
                    if ($sheet->locked_at === null) {
                        $sheet->update(['locked_at' => now()]);
                    }
                }

                $dailyRate = (float) $employee->current_daily_rate;
                $presentSheets = $sheets->where('is_present', true);
                $holidaySheets = $sheets->where('is_holiday', true);

                PayrollPeriodItem::create([
                    'account_id' => $accountId,
                    'payroll_period_id' => $payrollPeriod->id,
                    'employee_id' => $employee->id,
                    'daily_rate' => $dailyRate,
                    'total_regular_days' => $presentSheets->where('is_holiday', false)->where('is_rest_day', false)->count(),
                    'absent_days' => $sheets->where('is_present', false)->where('is_rest_day', false)->count(),
                    'holiday_days' => $holidaySheets->where('holiday_worked', true)->count(),
                    'late_minutes' => (int) $sheets->sum('late_minutes'),
                    'undertime_minutes' => (float) $sheets->sum('undertime_minutes'),
                    'overtime_minutes' => (int) $sheets->sum('overtime_minutes'),
                    'gross_pay' => (float) $sheets->sum('gross_pay'),
                    'late_deduction' => (float) $sheets->sum('late_deduction'),
                    'undertime_deduction' => (float) $sheets->sum('undertime_deduction'),
                    'overtime_pay' => (float) $sheets->sum('overtime_pay'),
                    'holiday_pay' => (float) $sheets->sum('holiday_pay'),
                    'fine_deduction' => $this->computeFineDeduction($employee, $periodStart, $periodEnd),
                    'sss_deduction' => $this->computeSssDeduction($employee),
                    'philhealth_deduction' => $this->computePhilhealthDeduction($employee, $accountId),
                    'pagibig_deduction' => $this->computePagibigDeduction($employee, $accountId),
                    'cash_advance_deduction' => $this->computeCashAdvanceDeduction($employee),
                    'night_differential_pay' => (float) $sheets->sum('night_differential_pay'),
                    'deminimis_total' => $this->computeDeminimisTotal($employee, $periodStart, $periodEnd),
                    'retroactive_pay' => $this->computeRetroactivePay($employee, $periodStart, $periodEnd),
                ]);
            }

            $this->computeNetPay($payrollPeriod);

            foreach ($payrollPeriod->items as $item) {
                $this->ledger->recordPayrollPeriodItem($accountId, $item->employee_id, $item->id, $item->toArray());
            }

            return $payrollPeriod;
        });
    }

    public function approve(PayrollPeriod $payrollPeriod, int $approvedBy): void
    {
        if ($payrollPeriod->status !== 'draft') {
            return;
        }

        $payrollPeriod->update([
            'status' => 'approved',
            'approved_by' => $approvedBy,
            'approved_at' => now(),
        ]);

        $this->ledger->recordPayrollApproval($payrollPeriod->account_id, $payrollPeriod->id, $approvedBy);
    }

    public function void(PayrollPeriod $payrollPeriod): void
    {
        DB::transaction(function () use ($payrollPeriod) {
            $payrollPeriod->items()->each(function (PayrollPeriodItem $item) use ($payrollPeriod) {
                $item->employee->attendanceSheets()
                    ->whereDate('date', '>=', $payrollPeriod->period_start)
                    ->whereDate('date', '<=', $payrollPeriod->period_end)
                    ->update(['locked_at' => null]);
            });

            $payrollPeriod->update(['status' => 'draft']);

            $this->ledger->recordPayrollVoid($payrollPeriod->account_id, $payrollPeriod->id);
        });
    }

    private function computeNetPay(PayrollPeriod $payrollPeriod): void
    {
        $payrollPeriod->items()->each(function (PayrollPeriodItem $item) {
            $deductions = $item->fine_deduction
                + $item->sss_deduction
                + $item->philhealth_deduction
                + $item->pagibig_deduction
                + $item->cash_advance_deduction
                + $item->late_deduction
                + $item->undertime_deduction;

            $additions = $item->gross_pay
                + $item->overtime_pay
                + $item->holiday_pay
                + $item->night_differential_pay
                + $item->thirteenth_month_pay
                + $item->deminimis_total
                + $item->retroactive_pay;

            $netPay = max(0, $additions - $deductions);

            $item->update(['net_pay' => $netPay]);
        });
    }

    private function computeFineDeduction(Employee $employee, string $periodStart, string $periodEnd): float
    {
        return (float) $employee->fines()
            ->whereDate('date', '>=', $periodStart)
            ->whereDate('date', '<=', $periodEnd)
            ->sum('amount');
    }

    private function computeSssDeduction(Employee $employee): float
    {
        if (! $employee->sss_number) {
            return 0;
        }

        $monthlySalary = (float) $employee->current_daily_rate * 26;

        $bracket = SssContributionBracket::where('salary_min', '<=', $monthlySalary)
            ->where(function ($q) use ($monthlySalary) {
                $q->whereNull('salary_max')
                    ->orWhere('salary_max', '>=', $monthlySalary);
            })
            ->first();

        if (! $bracket) {
            return 0;
        }

        return round(($monthlySalary * (float) $bracket->employee_percentage / 100) / 4, 2);
    }

    private function computePhilhealthDeduction(Employee $employee, int $accountId): float
    {
        if (! $employee->philhealth_number) {
            return 0;
        }

        $premiumPercent = $this->getCompanyConfig('philhealth_premium_percent', 5, $accountId);
        $monthlySalary = (float) $employee->current_daily_rate * 26;

        return round(($monthlySalary * $premiumPercent / 100 * 0.50) / 4, 2);
    }

    private function computePagibigDeduction(Employee $employee, int $accountId): float
    {
        if (! $employee->pagibig_number) {
            return 0;
        }

        $monthlyShare = $this->getCompanyConfig('pagibig_monthly_employee_share', 100, $accountId);

        return round($monthlyShare / 4, 2);
    }

    private function computeCashAdvanceDeduction(Employee $employee): float
    {
        $activeCA = $employee->cashAdvances()
            ->where('status', 'unpaid')
            ->where('remaining_balance', '>', 0)
            ->first();

        if (! $activeCA) {
            return 0;
        }

        return (float) $activeCA->remaining_balance;
    }

    private function computeDeminimisTotal(Employee $employee, string $periodStart, string $periodEnd): float
    {
        return (float) DeMinimisBenefitEntry::where('employee_id', $employee->id)
            ->whereNull('payroll_period_id')
            ->whereBetween('date', [$periodStart, $periodEnd])
            ->sum('amount');
    }

    private function computeRetroactivePay(Employee $employee, string $periodStart, string $periodEnd): float
    {
        return (float) RetroactivePayment::where('employee_id', $employee->id)
            ->whereNull('payroll_period_id')
            ->whereBetween('effective_from', [$periodStart, $periodEnd])
            ->sum('amount');
    }

    private function getCompanyConfig(string $key, float|int $default, int $accountId): float|int
    {
        return CompanyConfiguration::getValue($key, $default, $accountId);
    }
}
