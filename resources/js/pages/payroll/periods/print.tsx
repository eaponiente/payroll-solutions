import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
    employee_number: string;
};

type PeriodItem = {
    id: number;
    employee: Employee;
    daily_rate: number;
    total_regular_days: number;
    absent_days: number;
    holiday_days: number;
    late_minutes: number;
    undertime_minutes: number;
    overtime_minutes: number;
    gross_pay: number;
    late_deduction: number;
    undertime_deduction: number;
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
    status: string;
    items: PeriodItem[];
};

type PageProps = {
    period: PayrollPeriod;
};

const toDate = (val: string) => val.slice(0, 10);

const fmtCurrency = (amount: number) =>
    `₱${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (val: string) => {
    const d = new Date(val + 'T00:00:00');

    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const totalDeductions = (item: PeriodItem) =>
    Number(item.late_deduction || 0) +
    Number(item.undertime_deduction || 0) +
    Number(item.sss_deduction || 0) +
    Number(item.philhealth_deduction || 0) +
    Number(item.pagibig_deduction || 0) +
    Number(item.fine_deduction || 0) +
    Number(item.cash_advance_deduction || 0) +
    Number(item.other_deduction || 0);

export default function PayrollPeriodPrint({ period }: PageProps) {
    useEffect(() => {
        window.print();
    }, []);

    return (
        <>
            <Head title="Payslips" />

            <style>{`
                @media print {
                    @page { size: A4; margin: 1.2cm; }
                    body { -webkit-print-color-adjust: exact; }
                    .employee-page { page-break-after: always; }
                    .employee-page:last-child { page-break-after: auto; }
                    .no-print { display: none !important; }
                }
                body { font-family: system-ui, sans-serif; color: #1a1a1a; }
                .page-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 12px; }
                .page-header h1 { margin: 0 0 4px; font-size: 20px; }
                .page-header p { margin: 0; font-size: 13px; color: #555; }
                .employee-header { margin-bottom: 14px; }
                .employee-header h2 { margin: 0 0 2px; font-size: 16px; }
                .employee-header span { font-size: 13px; color: #555; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; }
                th { text-align: left; border-bottom: 1px solid #ccc; padding: 6px 4px; font-size: 12px; text-transform: uppercase; color: #666; }
                td { padding: 4px; border-bottom: 1px solid #eee; }
                .col-num { text-align: right; }
                .total-row td { font-weight: 700; border-top: 2px solid #333; border-bottom: none; padding-top: 8px; }
            `}</style>

            <div
                className="no-print"
                style={{ padding: 16, textAlign: 'center' }}
            >
                <button
                    onClick={() => window.print()}
                    style={{
                        padding: '8px 24px',
                        fontSize: 15,
                        cursor: 'pointer',
                    }}
                >
                    Print All Payslips
                </button>
            </div>

            {period.items.map((item) => (
                <div
                    key={item.id}
                    className="employee-page"
                    style={{ padding: '8px 0' }}
                >
                    <div className="page-header">
                        <h1>Payslip</h1>
                        <p>
                            {fmtDate(period.period_start)} —{' '}
                            {fmtDate(period.period_end)}
                        </p>
                    </div>

                    <div className="employee-header">
                        <h2>
                            {item.employee.first_name} {item.employee.last_name}
                        </h2>
                        <span>
                            #{item.employee.employee_number} — Daily Rate:{' '}
                            {fmtCurrency(item.daily_rate)}
                        </span>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Earnings</th>
                                <th className="col-num">Amount</th>
                                <th>Deductions</th>
                                <th className="col-num">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    Regular Days ({item.total_regular_days})
                                </td>
                                <td className="col-num">
                                    {fmtCurrency(
                                        item.total_regular_days *
                                            Number(item.daily_rate),
                                    )}
                                </td>
                                <td>Late ({item.late_minutes}m)</td>
                                <td className="col-num">
                                    {fmtCurrency(item.late_deduction)}
                                </td>
                            </tr>
                            <tr>
                                <td>Overtime ({item.overtime_minutes}m)</td>
                                <td className="col-num">
                                    {fmtCurrency(item.overtime_pay)}
                                </td>
                                <td>Undertime</td>
                                <td className="col-num">
                                    {fmtCurrency(item.undertime_deduction)}
                                </td>
                            </tr>
                            <tr>
                                <td>Holiday Pay</td>
                                <td className="col-num">
                                    {fmtCurrency(item.holiday_pay)}
                                </td>
                                <td>SSS</td>
                                <td className="col-num">
                                    {fmtCurrency(item.sss_deduction)}
                                </td>
                            </tr>
                            <tr>
                                <td>Holiday Days</td>
                                <td className="col-num">{item.holiday_days}</td>
                                <td>PhilHealth</td>
                                <td className="col-num">
                                    {fmtCurrency(item.philhealth_deduction)}
                                </td>
                            </tr>
                            <tr>
                                <td>Night Differential</td>
                                <td className="col-num">
                                    {fmtCurrency(item.night_differential_pay)}
                                </td>
                                <td>Pag-IBIG</td>
                                <td className="col-num">
                                    {fmtCurrency(item.pagibig_deduction)}
                                </td>
                            </tr>
                            <tr>
                                <td>13th Month Pay</td>
                                <td className="col-num">
                                    {fmtCurrency(item.thirteenth_month_pay)}
                                </td>
                                <td>Fines</td>
                                <td className="col-num">
                                    {fmtCurrency(item.fine_deduction)}
                                </td>
                            </tr>
                            <tr>
                                <td>De Minimis</td>
                                <td className="col-num">
                                    {fmtCurrency(item.deminimis_total)}
                                </td>
                                <td>Cash Advance</td>
                                <td className="col-num">
                                    {fmtCurrency(item.cash_advance_deduction)}
                                </td>
                            </tr>
                            <tr className="total-row">
                                <td>Gross Pay</td>
                                <td className="col-num">
                                    {fmtCurrency(item.gross_pay)}
                                </td>
                                <td>Total Deductions</td>
                                <td className="col-num">
                                    {fmtCurrency(totalDeductions(item))}
                                </td>
                            </tr>
                            <tr style={{ fontWeight: 700, fontSize: 15 }}>
                                <td colSpan={2}></td>
                                <td>Net Pay</td>
                                <td className="col-num">
                                    {fmtCurrency(item.net_pay)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ))}
        </>
    );
}
