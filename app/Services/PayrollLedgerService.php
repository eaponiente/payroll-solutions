<?php

namespace App\Services;

use App\Models\PayrollLedger;

class PayrollLedgerService
{
    public function recordPayrollPeriodItem(int $accountId, int $employeeId, int $referenceId, array $item): void
    {
        PayrollLedger::insertEntry([
            'account_id' => $accountId,
            'ledger_type' => 'payroll_period_item',
            'reference_type' => 'payroll_period_item',
            'reference_id' => $referenceId,
            'employee_id' => $employeeId,
            'description' => "Payroll period item #{$referenceId}",
            'credit' => $item['gross_pay'] ?? 0,
            'debit' => ($item['sss_deduction'] ?? 0)
                + ($item['philhealth_deduction'] ?? 0)
                + ($item['pagibig_deduction'] ?? 0)
                + ($item['fine_deduction'] ?? 0)
                + ($item['cash_advance_deduction'] ?? 0)
                + ($item['late_deduction'] ?? 0)
                + ($item['undertime_deduction'] ?? 0),
            'metadata' => $item,
            'created_at' => now(),
        ]);
    }

    public function recordPayrollApproval(int $accountId, int $periodId, int $approvedBy): void
    {
        PayrollLedger::insertEntry([
            'account_id' => $accountId,
            'ledger_type' => 'payroll_approval',
            'reference_type' => 'payroll_period',
            'reference_id' => $periodId,
            'description' => "Payroll period #{$periodId} approved by employee #{$approvedBy}",
            'credit' => 0,
            'debit' => 0,
            'metadata' => ['period_id' => $periodId, 'approved_by' => $approvedBy],
            'created_at' => now(),
        ]);
    }

    public function recordPayrollVoid(int $accountId, int $periodId): void
    {
        PayrollLedger::insertEntry([
            'account_id' => $accountId,
            'ledger_type' => 'payroll_void',
            'reference_type' => 'payroll_period',
            'reference_id' => $periodId,
            'description' => "Payroll period #{$periodId} voided",
            'credit' => 0,
            'debit' => 0,
            'metadata' => ['period_id' => $periodId],
            'created_at' => now(),
        ]);
    }

    public function recordCashAdvance(int $accountId, int $employeeId, int $referenceId, float $amount, string $reason): void
    {
        PayrollLedger::insertEntry([
            'account_id' => $accountId,
            'ledger_type' => 'cash_advance',
            'reference_type' => 'cash_advance',
            'reference_id' => $referenceId,
            'employee_id' => $employeeId,
            'description' => "Cash advance of ₱{$amount}: {$reason}",
            'debit' => $amount,
            'credit' => 0,
            'metadata' => ['amount' => $amount, 'reason' => $reason],
            'created_at' => now(),
        ]);
    }

    public function recordFine(int $accountId, int $employeeId, int $referenceId, float $amount, string $reason): void
    {
        PayrollLedger::insertEntry([
            'account_id' => $accountId,
            'ledger_type' => 'fine',
            'reference_type' => 'fine',
            'reference_id' => $referenceId,
            'employee_id' => $employeeId,
            'description' => "Fine of ₱{$amount}: {$reason}",
            'credit' => $amount,
            'debit' => 0,
            'metadata' => ['amount' => $amount, 'reason' => $reason],
            'created_at' => now(),
        ]);
    }

    public function recordSalaryChange(int $accountId, int $employeeId, int $referenceId, float $oldRate, float $newRate): void
    {
        PayrollLedger::insertEntry([
            'account_id' => $accountId,
            'ledger_type' => 'salary_change',
            'reference_type' => 'salary',
            'reference_id' => $referenceId,
            'employee_id' => $employeeId,
            'description' => "Salary changed from ₱{$oldRate} to ₱{$newRate}",
            'credit' => 0,
            'debit' => 0,
            'metadata' => ['old_rate' => $oldRate, 'new_rate' => $newRate],
            'created_at' => now(),
        ]);
    }
}
