import { Form, Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDateFormatter } from '@/lib/date';
import { my as myAttendance, punch } from '@/routes/attendance';
import type { Auth } from '@/types';

type AttendanceSheet = {
    id: number;
    date: string;
    schedule_start: string | null;
    schedule_end: string | null;
    time_in: string | null;
    time_out: string | null;
    lunch_start: string | null;
    lunch_end: string | null;
    late_minutes: number;
    late_deduction: number;
    undertime_minutes: number;
    overtime_minutes: number;
    overtime_pay: number;
    gross_pay: number;
    is_rest_day: boolean;
    is_holiday: boolean;
    holiday_type: string | null;
    holiday_pay: number;
    status: string;
};

type PaginatedData = {
    data: AttendanceSheet[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
};

type PageProps = {
    auth: Auth;
    sheets: PaginatedData;
    todaySheet: AttendanceSheet | null;
    hasPunchedIn: boolean;
    hasPunchedOut: boolean;
};

const formatCurrency = (amount: number | string | null) => {
    return `₱${Number(amount || 0).toFixed(2)}`;
};

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

const statusLabel = (status: string) => {
    if (!status) {
        return 'Unknown';
    }

    switch (status) {
        case 'present':
            return 'Present';
        case 'late':
            return 'Late';
        case 'absent':
            return 'Absent';
        case 'on_leave':
            return 'On Leave';
        default:
            return status.replace(/_/g, ' ');
    }
};

export default function MyAttendance({
    sheets,
    todaySheet,
    hasPunchedIn,
    hasPunchedOut,
}: PageProps) {
    const {
        formatDateFull,
        formatDate: fmtDate,
        formatTime: fmtTime,
        formatTimeRaw,
    } = useDateFormatter();
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const stats = useMemo(() => {
        const data = sheets.data;

        if (data.length === 0) {
            return { totalHours: 0, totalOt: 0, lateCount: 0, grossPay: 0 };
        }

        let totalMinutes = 0;
        let totalOt = 0;
        let lateCount = 0;
        let grossPay = 0;

        for (const sheet of data) {
            if (sheet.time_in && sheet.time_out) {
                const start = new Date(sheet.time_in).getTime();
                const end = new Date(sheet.time_out).getTime();
                let breakMinutes = 0;

                if (sheet.lunch_start && sheet.lunch_end) {
                    breakMinutes =
                        (new Date(sheet.lunch_end).getTime() -
                            new Date(sheet.lunch_start).getTime()) /
                        60000;
                }

                const workedMinutes = Math.max(
                    0,
                    (end - start) / 60000 - breakMinutes,
                );
                totalMinutes += workedMinutes;
            }

            totalOt += sheet.overtime_minutes;

            if (sheet.late_minutes > 0) {
                lateCount++;
            }

            grossPay += Number(sheet.gross_pay || 0);
        }

        return {
            totalHours: (totalMinutes / 60).toFixed(1),
            totalOt: (totalOt / 60).toFixed(1),
            lateCount,
            grossPay,
        };
    }, [sheets.data]);

    const scheduleDisplay =
        todaySheet?.schedule_start && todaySheet?.schedule_end
            ? `${formatTimeRaw(todaySheet.schedule_start)} - ${formatTimeRaw(todaySheet.schedule_end)}`
            : null;

    const handleFilter = () => {
        router.reload({
            data: { from: dateFrom || undefined, to: dateTo || undefined },
            only: ['sheets'],
        });
    };

    const prevLink = sheets.links[0];
    const nextLink = sheets.links[sheets.links.length - 1];

    return (
        <>
            <Head title="My Attendance" />

            <div className="space-y-6">
                <Heading
                    title="My Attendance"
                    description="View your daily time records and punch in/out"
                />

                <Card>
                    <CardContent className="space-y-6 pt-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    {todaySheet
                                        ? formatDateFull(todaySheet.date)
                                        : formatDateFull(
                                              new Date()
                                                  .toISOString()
                                                  .split('T')[0],
                                          )}
                                </h2>
                                {scheduleDisplay && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {scheduleDisplay}
                                    </p>
                                )}
                            </div>
                            <Badge
                                variant={
                                    todaySheet
                                        ? statusVariant(todaySheet.status)
                                        : 'outline'
                                }
                                className="h-fit text-sm capitalize"
                            >
                                {todaySheet
                                    ? statusLabel(todaySheet.status)
                                    : 'No Schedule'}
                            </Badge>
                        </div>

                        <Form
                            {...punch.form()}
                            options={{ preserveScroll: true }}
                        >
                            {({ processing }) => (
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        type="submit"
                                        name="type"
                                        value="in"
                                        disabled={processing || hasPunchedIn}
                                    >
                                        Punch In
                                    </Button>
                                    <Button
                                        type="submit"
                                        name="type"
                                        value="out"
                                        variant="destructive"
                                        disabled={
                                            processing ||
                                            !hasPunchedIn ||
                                            hasPunchedOut
                                        }
                                    >
                                        Punch Out
                                    </Button>
                                    <Button
                                        type="submit"
                                        name="type"
                                        value="lunch_out"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Lunch Out
                                    </Button>
                                    <Button
                                        type="submit"
                                        name="type"
                                        value="lunch_in"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        Lunch In
                                    </Button>
                                </div>
                            )}
                        </Form>

                        {todaySheet ? (
                            <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-4">
                                <div>
                                    <p className="text-muted-foreground">
                                        Punch In
                                    </p>
                                    <p className="font-medium">
                                        {fmtTime(todaySheet.time_in)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Punch Out
                                    </p>
                                    <p className="font-medium">
                                        {fmtTime(todaySheet.time_out)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Gross Pay
                                    </p>
                                    <p className="font-medium">
                                        {formatCurrency(todaySheet.gross_pay)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Late / OT
                                    </p>
                                    <p className="font-medium">
                                        {todaySheet.late_minutes > 0 ? (
                                            <span className="text-destructive">
                                                {todaySheet.late_minutes}m late
                                            </span>
                                        ) : (
                                            '-'
                                        )}
                                        {todaySheet.late_minutes > 0 &&
                                            todaySheet.overtime_minutes > 0 &&
                                            ' / '}
                                        {todaySheet.overtime_minutes > 0 ? (
                                            <span className="text-green-600 dark:text-green-400">
                                                {todaySheet.overtime_minutes}m
                                                OT
                                            </span>
                                        ) : null}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                                No timesheet for today. You may be on a rest day
                                or holiday.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">
                                Hours
                            </p>
                            <p className="text-2xl font-bold">
                                {stats.totalHours}h
                            </p>
                            <p className="text-xs text-muted-foreground">
                                this period
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">
                                Overtime
                            </p>
                            <p className="text-2xl font-bold">
                                {stats.totalOt}h
                            </p>
                            <p className="text-xs text-muted-foreground">
                                this period
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">
                                Late Days
                            </p>
                            <p className="text-2xl font-bold">
                                {stats.lateCount}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                this period
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">
                                Gross Pay
                            </p>
                            <p className="text-2xl font-bold">
                                {formatCurrency(stats.grossPay)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                this period
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Attendance History</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="dateFrom">Date From</Label>
                                <Input
                                    id="dateFrom"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) =>
                                        setDateFrom(e.target.value)
                                    }
                                    className="w-auto"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="dateTo">Date To</Label>
                                <Input
                                    id="dateTo"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-auto"
                                />
                            </div>
                            <Button variant="outline" onClick={handleFilter}>
                                Filter
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-2 text-left font-medium">
                                            Date
                                        </th>
                                        <th className="hidden px-4 py-2 text-left font-medium sm:table-cell">
                                            Schedule
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Punch In
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Punch Out
                                        </th>
                                        <th className="px-4 py-2 text-right font-medium">
                                            Late
                                        </th>
                                        <th className="px-4 py-2 text-right font-medium">
                                            OT
                                        </th>
                                        <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">
                                            Gross Pay
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sheets.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="px-4 py-12 text-center"
                                            >
                                                <p className="text-sm text-muted-foreground">
                                                    No attendance records found
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Try adjusting your date
                                                    filters or check back after
                                                    your next shift.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        sheets.data.map((sheet) => (
                                            <tr
                                                key={sheet.id}
                                                className="border-b"
                                            >
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    {fmtDate(sheet.date)}
                                                </td>
                                                <td className="hidden px-4 py-2 whitespace-nowrap sm:table-cell">
                                                    {sheet.schedule_start &&
                                                    sheet.schedule_end
                                                        ? `${formatTimeRaw(sheet.schedule_start)} - ${formatTimeRaw(sheet.schedule_end)}`
                                                        : '-'}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    {fmtTime(sheet.time_in)}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    {fmtTime(sheet.time_out)}
                                                </td>
                                                <td className="px-4 py-2 text-right whitespace-nowrap">
                                                    {sheet.late_minutes > 0 ? (
                                                        <span className="text-destructive">
                                                            {sheet.late_minutes}
                                                            m
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-right whitespace-nowrap">
                                                    {sheet.overtime_minutes >
                                                    0 ? (
                                                        <span className="text-green-600 dark:text-green-400">
                                                            {
                                                                sheet.overtime_minutes
                                                            }
                                                            m
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="hidden px-4 py-2 text-right whitespace-nowrap sm:table-cell">
                                                    {formatCurrency(
                                                        sheet.gross_pay,
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap">
                                                    <Badge
                                                        variant={statusVariant(
                                                            sheet.status,
                                                        )}
                                                        className="capitalize"
                                                    >
                                                        {statusLabel(
                                                            sheet.status,
                                                        )}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {sheets.last_page > 1 && (
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={sheets.current_page === 1}
                                    asChild
                                >
                                    <Link
                                        href={prevLink?.url || '#'}
                                        preserveState
                                        only={['sheets']}
                                    >
                                        Previous
                                    </Link>
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {sheets.current_page} of{' '}
                                    {sheets.last_page}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                        sheets.current_page === sheets.last_page
                                    }
                                    asChild
                                >
                                    <Link
                                        href={nextLink?.url || '#'}
                                        preserveState
                                        only={['sheets']}
                                    >
                                        Next
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

MyAttendance.layout = {
    breadcrumbs: [
        {
            title: 'My Attendance',
            href: myAttendance(),
        },
    ],
};
