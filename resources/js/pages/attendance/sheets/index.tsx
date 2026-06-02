import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDateFormatter } from '@/lib/date';
import { index } from '@/routes/attendance/sheets';
import type { Auth } from '@/types';
import AdjustAttendanceDialog from './adjust-dialog';
import AttendanceSheetsFilters from './filters';
import ManualTimeLogDialog from './manual-dialog';
import AttendanceSheetsTable from './table';

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
    employee_number: string;
};

type AttendanceSheet = {
    id: number;
    employee_id: number;
    employee: Employee;
    date: string;
    time_in: string | null;
    time_out: string | null;
    lunch_in: string | null;
    lunch_out: string | null;
    gross_pay: number;
    late_minutes: number;
    overtime_minutes: number;
    undertime_minutes: number;
    status: string;
};

type PaginatedData = {
    data: AttendanceSheet[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
    current_page: number;
    last_page: number;
};

type PageProps = {
    auth: Auth;
    sheets: PaginatedData;
    employees: Employee[];
};

export default function AttendanceSheets({ sheets, employees }: PageProps) {
    const page = usePage<{ props: { auth: Auth }; url: string }>();
    const auth = page.props.auth;
    const currentUrl = page.url;
    const queryString = currentUrl.includes('?') ? currentUrl.split('?')[1] ?? '' : '';
    const searchParams = new URLSearchParams(queryString);
    const permissions = (auth.user?.permissions as string[]) ?? [];
    const has = (p: string) => permissions.includes(p);
    const [adjustSheet, setAdjustSheet] = useState<AttendanceSheet | null>(
        null,
    );
    const [processingPay, setProcessingPay] = useState(false);

    const { formatDate, formatTime } = useDateFormatter();

    const formatCurrency = (amount: number | string | null) =>
        `₱${Number(amount || 0).toFixed(2)}`;

    const statusVariant = (status: string) => {
        switch (status) {
            case 'present':
                return 'default' as const;
            case 'late':
                return 'secondary' as const;
            case 'absent':
                return 'destructive' as const;
            case 'on_leave':
                return 'outline' as const;
            default:
                return 'outline' as const;
        }
    };

    const handleFilter = (from: string, to: string, search: string) => {
        router.get(
            window.location.pathname,
            {
                from: from || undefined,
                to: to || undefined,
                search: search || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const canProcessPay = !processingPay && !!fromParam && !!toParam;

    const tooltipReason = !fromParam || !toParam
        ? 'Set both From and To dates in the filters to process pay'
        : '';

    const handleProcessPay = () => {
        if (!fromParam) {
            return;
        }

        setProcessingPay(true);

        router.post(
            '/attendance/sheets/process-pay',
            { date: fromParam },
            {
                preserveState: false,
                preserveScroll: true,
                onFinish: () => setProcessingPay(false),
            },
        );
    };

    return (
        <>
            <Head title="Attendance Sheets" />
            <div className="space-y-6">
                <Heading
                    title="Attendance Sheets"
                    description="Manage daily time records"
                />

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <CardTitle>
                            Records
                            {sheets.total > 0 && (
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    ({sheets.total} total)
                                </span>
                            )}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {has('attendance.adjust') && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span>
                                                <Button
                                                    variant="secondary"
                                                    disabled={!canProcessPay}
                                                    onClick={
                                                        handleProcessPay
                                                    }
                                                >
                                                    {processingPay
                                                        ? 'Processing...'
                                                        : 'Process Pay'}
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        {!canProcessPay && (
                                            <TooltipContent>
                                                <p>{tooltipReason}</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            <ManualTimeLogDialog
                                employees={employees}
                                hasPermission={has(
                                    'attendance.create_manual',
                                )}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <AttendanceSheetsFilters onFilter={handleFilter} />
                        <AttendanceSheetsTable
                            sheets={sheets.data}
                            links={sheets.links}
                            onAdjust={setAdjustSheet}
                            hasAdjustPerm={has('attendance.adjust')}
                            formatDate={formatDate}
                            formatTime={formatTime}
                            formatCurrency={formatCurrency}
                            statusVariant={statusVariant}
                        />
                    </CardContent>
                </Card>

                <AdjustAttendanceDialog
                    sheet={adjustSheet}
                    onClose={() => setAdjustSheet(null)}
                    formatDate={formatDate}
                />
            </div>
        </>
    );
}

AttendanceSheets.layout = {
    breadcrumbs: [
        {
            title: 'Attendance Sheets',
            href: index(),
        },
    ],
};
