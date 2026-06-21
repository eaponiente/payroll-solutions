import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useDateFormatter } from '@/lib/date';

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

type Props = {
    item: PeriodItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    periodStart: string;
    periodEnd: string;
};

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between py-0.5 px-2 odd:bg-muted/30 rounded">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs font-medium">{value}</span>
        </div>
    );
}

function SectionBox({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-card text-card-foreground">
            <div className="border-b px-3 py-1">
                <h4 className="text-xs font-semibold">{title}</h4>
            </div>
            <div className="p-1">{children}</div>
        </div>
    );
}

export default function PayrollItemDialog({
    item,
    open,
    onOpenChange,
    periodStart,
    periodEnd,
}: Props) {
    const { formatDate } = useDateFormatter();
    const fmt = (n: number | string | null) =>
        `₱${Number(n || 0).toFixed(2)}`;

    if (!item) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Payslip</DialogTitle>
                    <DialogDescription>
                        {item.employee.first_name} {item.employee.last_name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    {/* Employee Header */}
                    <div className="rounded-lg border px-3 py-2 space-y-0.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Employee</span>
                            <span className="text-xs font-medium">
                                {item.employee.first_name} {item.employee.last_name}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Emp #</span>
                            <span className="text-xs font-medium">
                                {item.employee.employee_number}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Period</span>
                            <span className="text-xs font-medium">
                                {formatDate(periodStart)} – {formatDate(periodEnd)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Daily Rate</span>
                            <span className="text-xs font-medium">{fmt(item.daily_rate)}</span>
                        </div>
                    </div>

                    {/* Attendance */}
                    <SectionBox title="Attendance Summary">
                        <Row label="Regular Days" value={String(item.total_regular_days)} />
                        <Row label="Absent Days" value={String(item.absent_days)} />
                        <Row label="Holiday Days" value={String(item.holiday_days)} />
                        <Row label="Late (min)" value={String(item.late_minutes)} />
                        <Row label="Undertime (min)" value={String(item.undertime_minutes)} />
                        <Row label="Overtime (min)" value={String(item.overtime_minutes)} />
                    </SectionBox>

                    {/* Earnings / Deductions — 2 columns */}
                    <div className="grid grid-cols-2 gap-3">
                        <SectionBox title="Earnings">
                            <Row label="Gross Pay" value={fmt(item.gross_pay)} />
                            <Row label="Overtime Pay" value={fmt(item.overtime_pay)} />
                            <Row label="Holiday Pay" value={fmt(item.holiday_pay)} />
                            <Row label="Night Differential" value={fmt(item.night_differential_pay)} />
                            <Row label="13th Month" value={fmt(item.thirteenth_month_pay)} />
                            <Row label="De Minimis" value={fmt(item.deminimis_total)} />
                            <Row label="Retroactive" value={fmt(item.retroactive_pay)} />
                        </SectionBox>
                        <SectionBox title="Deductions">
                            <Row label="Late" value={fmt(item.late_deduction)} />
                            <Row label="SSS" value={fmt(item.sss_deduction)} />
                            <Row label="PhilHealth" value={fmt(item.philhealth_deduction)} />
                            <Row label="Pag-IBIG" value={fmt(item.pagibig_deduction)} />
                            <Row label="Fines" value={fmt(item.fine_deduction)} />
                            <Row label="Cash Advance" value={fmt(item.cash_advance_deduction)} />
                            <Row label="Other" value={fmt(item.other_deduction)} />
                        </SectionBox>
                    </div>

                    {/* Net Pay Footer */}
                    <div className="rounded-lg border px-3 py-2 flex items-center justify-between bg-muted/30">
                        <span className="text-xs font-semibold">Net Pay</span>
                        <span className="text-base font-bold">{fmt(item.net_pay)}</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
