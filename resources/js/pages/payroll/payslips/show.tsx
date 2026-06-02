import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDateFormatter } from '@/lib/date';

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
    employee_number: string;
    location: string | null;
};

type PayrollPeriod = {
    id: number;
    period_start: string;
    period_end: string;
};

type PayslipItem = {
    id: number;
    payroll_period_id: number;
    payrollPeriod: PayrollPeriod;
    gross_pay: number;
    late_deduction: number;
    overtime_pay: number;
    holiday_pay: number;
    sss_deduction: number;
    philhealth_deduction: number;
    pagibig_deduction: number;
    fine_deduction: number;
    cash_advance_deduction: number;
    net_pay: number;
};

type PaginatedData = {
    data: PayslipItem[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
};

type PageProps = {
    employee: Employee;
    items: PaginatedData;
};

export default function PayslipShow({ employee, items }: PageProps) {
    const formatCurrency = (amount: number | string | null) => {
        return `₱${Number(amount || 0).toFixed(2)}`;
    };

    const { formatDate } = useDateFormatter();

    return (
        <>
            <Head
                title={`Payslips: ${employee.first_name} ${employee.last_name}`}
            />

            <div className="mb-6">
                <Heading
                    title={`${employee.first_name} ${employee.last_name}`}
                    description="Employee payslips"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                    {employee.employee_number}
                    {employee.location ? ` · ${employee.location}` : ''}
                </p>
            </div>

            <div className="space-y-6">
                {items.data.map((item) => (
                    <Card key={item.id}>
                        <CardHeader>
                            <CardTitle className="text-base">
                                {formatDate(item.payrollPeriod.period_start)} –{' '}
                                {formatDate(item.payrollPeriod.period_end)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b">
                                        <td className="py-2 font-medium">
                                            Gross Pay
                                        </td>
                                        <td className="py-2 text-right font-medium">
                                            {formatCurrency(item.gross_pay)}
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 text-muted-foreground">
                                            Less: Late Deduction
                                        </td>
                                        <td className="py-2 text-right text-red-600">
                                            -
                                            {formatCurrency(
                                                item.late_deduction,
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 text-muted-foreground">
                                            Add: Overtime Pay
                                        </td>
                                        <td className="py-2 text-right text-green-600">
                                            +{formatCurrency(item.overtime_pay)}
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 text-muted-foreground">
                                            Add: Holiday Pay
                                        </td>
                                        <td className="py-2 text-right text-green-600">
                                            +{formatCurrency(item.holiday_pay)}
                                        </td>
                                    </tr>
                                    <tr className="border-t-2">
                                        <td className="py-2 font-medium">
                                            Deductions
                                        </td>
                                        <td className="py-2"></td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 pl-4 text-muted-foreground">
                                            SSS
                                        </td>
                                        <td className="py-2 text-right text-red-600">
                                            -
                                            {formatCurrency(item.sss_deduction)}
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 pl-4 text-muted-foreground">
                                            PhilHealth
                                        </td>
                                        <td className="py-2 text-right text-red-600">
                                            -
                                            {formatCurrency(
                                                item.philhealth_deduction,
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 pl-4 text-muted-foreground">
                                            Pag-IBIG
                                        </td>
                                        <td className="py-2 text-right text-red-600">
                                            -
                                            {formatCurrency(
                                                item.pagibig_deduction,
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 pl-4 text-muted-foreground">
                                            Fines
                                        </td>
                                        <td className="py-2 text-right text-red-600">
                                            -
                                            {formatCurrency(
                                                item.fine_deduction,
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 pl-4 text-muted-foreground">
                                            Cash Advance
                                        </td>
                                        <td className="py-2 text-right text-red-600">
                                            -
                                            {formatCurrency(
                                                item.cash_advance_deduction,
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="border-t-2 bg-muted/50">
                                        <td className="py-3 text-base font-bold">
                                            Net Pay
                                        </td>
                                        <td className="py-3 text-right text-base font-bold">
                                            {formatCurrency(item.net_pay)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                ))}

                {items.data.length === 0 && (
                    <p className="py-8 text-center text-muted-foreground">
                        No payslips found for this employee.
                    </p>
                )}

                {items.links.length > 3 && (
                    <div className="flex items-center justify-center gap-1">
                        {items.links.map((link, i) =>
                            link.url ? (
                                <Link
                                    key={i}
                                    href={link.url}
                                    preserveScroll
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent'
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : (
                                <span
                                    key={i}
                                    className="inline-flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ),
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

PayslipShow.layout = {
    breadcrumbs: [
        {
            title: 'Payroll',
            href: '/payroll',
        },
        {
            title: 'Payslips',
            href: '',
        },
    ],
};
