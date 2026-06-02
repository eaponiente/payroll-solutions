import { Form, Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDateFormatter } from '@/lib/date';
import { approve, voidMethod, index, print } from '@/routes/payroll/periods';

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
    employee_number: string;
};

type PeriodItem = {
    id: number;
    employee: Employee;
    gross_pay: number;
    late_deduction: number;
    overtime_pay: number;
    holiday_pay: number;
    night_differential_pay: number;
    thirteenth_month_pay: number;
    deminimis_total: number;
    retroactive_pay: number;
    sss_deduction: number;
    philhealth_deduction: number;
    pagibig_deduction: number;
    fine_deduction: number;
    cash_advance_deduction: number;
    other_deduction: number;
    net_pay: number;
    leaves_present: number;
    rest_days_present: number;
    holiday_worked: number;
};

type PayrollPeriod = {
    id: number;
    period_start: string;
    period_end: string;
    status: 'draft' | 'approved' | 'voided';
    approved_by: number | null;
    approved_at: string | null;
    approver: { id: number; first_name: string; last_name: string } | null;
    items: PeriodItem[];
};

type PageProps = {
    period: PayrollPeriod;
};

export default function PayrollPeriodShow({ period }: PageProps) {
    const formatCurrency = (amount: number | string | null) => {
        return `₱${Number(amount || 0).toFixed(2)}`;
    };

    const { formatDate } = useDateFormatter();

    const statusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="border-green-200 bg-green-100 text-green-700">
                        {status}
                    </Badge>
                );
            case 'voided':
                return (
                    <Badge className="border-red-200 bg-red-100 text-red-700">
                        {status}
                    </Badge>
                );
            default:
                return (
                    <Badge className="border-gray-200 bg-gray-100 text-gray-700">
                        {status}
                    </Badge>
                );
        }
    };

    const totals = period.items.reduce(
        (acc, item) => ({
            gross_pay: acc.gross_pay + Number(item.gross_pay || 0),
            late_deduction:
                acc.late_deduction + Number(item.late_deduction || 0),
            overtime_pay: acc.overtime_pay + Number(item.overtime_pay || 0),
            holiday_pay: acc.holiday_pay + Number(item.holiday_pay || 0),
            night_differential_pay:
                acc.night_differential_pay +
                Number(item.night_differential_pay || 0),
            thirteenth_month_pay:
                acc.thirteenth_month_pay +
                Number(item.thirteenth_month_pay || 0),
            deminimis_total:
                acc.deminimis_total + Number(item.deminimis_total || 0),
            retroactive_pay:
                acc.retroactive_pay + Number(item.retroactive_pay || 0),
            sss_deduction: acc.sss_deduction + Number(item.sss_deduction || 0),
            philhealth_deduction:
                acc.philhealth_deduction +
                Number(item.philhealth_deduction || 0),
            pagibig_deduction:
                acc.pagibig_deduction + Number(item.pagibig_deduction || 0),
            fine_deduction:
                acc.fine_deduction + Number(item.fine_deduction || 0),
            cash_advance_deduction:
                acc.cash_advance_deduction +
                Number(item.cash_advance_deduction || 0),
            other_deduction:
                acc.other_deduction + Number(item.other_deduction || 0),
            net_pay: acc.net_pay + Number(item.net_pay || 0),
        }),
        {
            gross_pay: 0,
            late_deduction: 0,
            overtime_pay: 0,
            holiday_pay: 0,
            night_differential_pay: 0,
            thirteenth_month_pay: 0,
            deminimis_total: 0,
            retroactive_pay: 0,
            sss_deduction: 0,
            philhealth_deduction: 0,
            pagibig_deduction: 0,
            fine_deduction: 0,
            cash_advance_deduction: 0,
            other_deduction: 0,
            net_pay: 0,
        },
    );

    const deductionColumns = [
        { key: 'late_deduction' as const, label: 'Late' },
        { key: 'sss_deduction' as const, label: 'SSS' },
        { key: 'philhealth_deduction' as const, label: 'PhilHealth' },
        { key: 'pagibig_deduction' as const, label: 'Pag-IBIG' },
        { key: 'fine_deduction' as const, label: 'Fines' },
        { key: 'cash_advance_deduction' as const, label: 'Cash Adv' },
        { key: 'other_deduction' as const, label: 'Other' },
    ];

    return (
        <>
            <Head
                title={`Period: ${formatDate(period.period_start)} – ${formatDate(period.period_end)}`}
            />

            <div className="mb-6 flex items-center justify-between">
                <Heading
                    title={`Payroll Period`}
                    description={`${formatDate(period.period_start)} – ${formatDate(period.period_end)}`}
                />
                <div className="flex items-center gap-3">
                    <a
                        href={print.url({ period: period.id })}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Button variant="outline">Print Payslips</Button>
                    </a>
                    <Link href={index()}>
                        <Button variant="outline">Back to Periods</Button>
                    </Link>
                </div>
            </div>

            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Period
                            </p>
                            <p className="font-medium">
                                {formatDate(period.period_start)} –{' '}
                                {formatDate(period.period_end)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Status
                            </p>
                            <p>{statusBadge(period.status)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Employees
                            </p>
                            <p className="font-medium">{period.items.length}</p>
                        </div>
                    </div>

                    {period.approver && (
                        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Approved By
                                </p>
                                <p className="font-medium">
                                    {period.approver.first_name}{' '}
                                    {period.approver.last_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Approved At
                                </p>
                                <p className="font-medium">
                                    {period.approved_at
                                        ? formatDate(period.approved_at)
                                        : '-'}
                                </p>
                            </div>
                        </div>
                    )}

                    {period.status === 'draft' && (
                        <div className="mt-6 flex items-center gap-3">
                            <Form {...approve.form({ period: period.id })}>
                                {({ processing }: { processing: boolean }) => (
                                    <Button disabled={processing}>
                                        Approve Period
                                    </Button>
                                )}
                            </Form>
                            <Form {...voidMethod.form({ period: period.id })}>
                                {({ processing }: { processing: boolean }) => (
                                    <Button
                                        variant="destructive"
                                        disabled={processing}
                                    >
                                        Void Period
                                    </Button>
                                )}
                            </Form>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payroll Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="pb-3 font-medium text-muted-foreground">
                                        Employee
                                    </th>
                                    <th className="pb-3 text-right font-medium text-muted-foreground">
                                        Gross Pay
                                    </th>
                                    <th className="pb-3 text-right font-medium text-muted-foreground">
                                        OT
                                    </th>
                                    <th className="pb-3 text-right font-medium text-muted-foreground">
                                        Holiday
                                    </th>
                                    <th className="pb-3 text-right font-medium text-muted-foreground">
                                        Night Diff
                                    </th>
                                    <th className="pb-3 text-right font-medium text-muted-foreground">
                                        13th Mo.
                                    </th>
                                    <th className="pb-3 text-right font-medium text-muted-foreground">
                                        De Minimis
                                    </th>
                                    <th className="pb-3 text-right font-medium text-muted-foreground">
                                        Retro
                                    </th>
                                    {deductionColumns.map((col) => (
                                        <th
                                            key={col.key}
                                            className="pb-3 text-right font-medium text-muted-foreground"
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                    <th className="pb-3 text-right font-medium text-muted-foreground">
                                        Net Pay
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {period.items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="py-3">
                                            <p className="font-medium">
                                                {item.employee.first_name}{' '}
                                                {item.employee.last_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.employee.employee_number}
                                            </p>
                                        </td>
                                        <td className="py-3 text-right">
                                            {formatCurrency(item.gross_pay)}
                                        </td>
                                        <td className="py-3 text-right">
                                            {formatCurrency(item.overtime_pay)}
                                        </td>
                                        <td className="py-3 text-right">
                                            {formatCurrency(item.holiday_pay)}
                                        </td>
                                        <td className="py-3 text-right">
                                            {formatCurrency(
                                                item.night_differential_pay,
                                            )}
                                        </td>
                                        <td className="py-3 text-right">
                                            {formatCurrency(
                                                item.thirteenth_month_pay,
                                            )}
                                        </td>
                                        <td className="py-3 text-right">
                                            {formatCurrency(
                                                item.deminimis_total,
                                            )}
                                        </td>
                                        <td className="py-3 text-right">
                                            {formatCurrency(
                                                item.retroactive_pay,
                                            )}
                                        </td>
                                        {deductionColumns.map((col) => (
                                            <td
                                                key={col.key}
                                                className="py-3 text-right"
                                            >
                                                {formatCurrency(item[col.key])}
                                            </td>
                                        ))}
                                        <td className="py-3 text-right font-semibold">
                                            {formatCurrency(item.net_pay)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 bg-muted/50">
                                    <td className="py-3 font-semibold">
                                        Totals
                                    </td>
                                    <td className="py-3 text-right font-semibold">
                                        {formatCurrency(totals.gross_pay)}
                                    </td>
                                    <td className="py-3 text-right font-semibold">
                                        {formatCurrency(totals.overtime_pay)}
                                    </td>
                                    <td className="py-3 text-right font-semibold">
                                        {formatCurrency(totals.holiday_pay)}
                                    </td>
                                    <td className="py-3 text-right font-semibold">
                                        {formatCurrency(
                                            totals.night_differential_pay,
                                        )}
                                    </td>
                                    <td className="py-3 text-right font-semibold">
                                        {formatCurrency(
                                            totals.thirteenth_month_pay,
                                        )}
                                    </td>
                                    <td className="py-3 text-right font-semibold">
                                        {formatCurrency(totals.deminimis_total)}
                                    </td>
                                    <td className="py-3 text-right font-semibold">
                                        {formatCurrency(totals.retroactive_pay)}
                                    </td>
                                    {deductionColumns.map((col) => (
                                        <td
                                            key={col.key}
                                            className="py-3 text-right font-semibold"
                                        >
                                            {formatCurrency(totals[col.key])}
                                        </td>
                                    ))}
                                    <td className="py-3 text-right font-semibold">
                                        {formatCurrency(totals.net_pay)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

PayrollPeriodShow.layout = {
    breadcrumbs: [
        {
            title: 'Payroll',
            href: '/payroll',
        },
        {
            title: 'Periods',
            href: '/payroll/periods',
        },
        {
            title: 'View Period',
            href: '',
        },
    ],
};
