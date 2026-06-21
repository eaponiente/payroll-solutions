import { Form, Head, usePage } from '@inertiajs/react';
import { Ban, Banknote, Pencil, Timer, Umbrella, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useDateFormatter } from '@/lib/date';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { punch } from '@/routes/attendance';

type Pending = {
    overtime: number;
    leaves: number;
    corrections: number;
    cash_advances: number;
    fines: number;
};

type TodayAttendance = {
    present: number;
    late: number;
    absent: number;
    on_leave: number;
};

type TodaySheet = {
    id: number;
    date: string;
    schedule_start: string | null;
    schedule_end: string | null;
    time_in: string | null;
    time_out: string | null;
    late_minutes: number;
    overtime_minutes: number;
    gross_pay: number;
    status: string;
} | null;

type RecentLog = {
    id: number;
    type: 'in' | 'out' | 'lunch_out' | 'lunch_in';
    source: string;
    punched_at: string;
};

type PageProps = {
    pending: Pending;
    todayAttendance: TodayAttendance;
    totalEmployees: number;
    myTodaySheet: TodaySheet;
    hasPunchedIn: boolean;
    hasPunchedOut: boolean;
    recentLogs: RecentLog[];
};

function StatCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-5">
                <div
                    className={cn(
                        'flex size-12 shrink-0 items-center justify-center rounded-xl',
                        color,
                    )}
                >
                    <Icon className="size-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-muted-foreground">
                        {label}
                    </p>
                    <p className="text-2xl font-bold tracking-tight">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function AttendanceStat({
    label,
    value,
    total,
    color,
}: {
    label: string;
    value: number;
    total: number;
    color: string;
}) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
                <div className={cn('size-3 rounded-full', color)} />
                <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="text-right">
                <span className="text-lg font-bold tabular-nums">{value}</span>
                <span className="ml-1 text-xs text-muted-foreground">
                    {pct}%
                </span>
            </div>
        </div>
    );
}

const formatCurrency = (amount: number | string | null) =>
    `₱${Number(amount || 0).toFixed(2)}`;

const formatTimeRaw = (value: string | null) => {
    if (!value) {
        return '-';
    }

    const match = value.match(/T(\d{2}):(\d{2})/);

    if (!match) {
        return value;
    }

    const h = +match[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;

    return `${h12}:${match[2]} ${ampm}`;
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

const logTypeLabel = (type: string) => {
    switch (type) {
        case 'in':
            return 'Punch In';
        case 'out':
            return 'Punch Out';
        case 'lunch_out':
            return 'Start Break';
        case 'lunch_in':
            return 'End Break';
        default:
            return type;
    }
};

const logSourceLabel = (source: string) => {
    switch (source) {
        case 'self_service':
            return 'Self';
        case 'manual':
            return 'Manual';
        case 'adjusted':
            return 'Adjusted';
        case 'correction':
            return 'Correction';
        case 'biometric':
            return 'Biometric';
        default:
            return source;
    }
};

export default function Dashboard() {
    const {
        pending,
        todayAttendance,
        totalEmployees,
        myTodaySheet,
        hasPunchedIn,
        hasPunchedOut,
        recentLogs,
    } = usePage<PageProps>().props;

    const { formatDateFull, formatTime: fmtTime } = useDateFormatter();

    const todayTotal =
        todayAttendance.present +
        todayAttendance.late +
        todayAttendance.absent +
        todayAttendance.on_leave;

    const scheduleDisplay =
        myTodaySheet?.schedule_start && myTodaySheet?.schedule_end
            ? `${formatTimeRaw(myTodaySheet.schedule_start)} - ${formatTimeRaw(myTodaySheet.schedule_end)}`
            : null;

    return (
        <>
            <Head title="Dashboard" />

            <div className="space-y-6 p-4 md:p-6">
                {/* My Today Card */}
                <Card>
                    <CardContent className="space-y-6 pt-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    {myTodaySheet
                                        ? formatDateFull(myTodaySheet.date)
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
                                    myTodaySheet
                                        ? statusVariant(myTodaySheet.status)
                                        : 'outline'
                                }
                                className="h-fit text-sm capitalize"
                            >
                                {myTodaySheet
                                    ? statusLabel(myTodaySheet.status)
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
                                        Start Break
                                    </Button>
                                    <Button
                                        type="submit"
                                        name="type"
                                        value="lunch_in"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        End Break
                                    </Button>
                                </div>
                            )}
                        </Form>

                        {recentLogs.length > 0 && (
                            <div className="rounded-lg border">
                                <div className="border-b px-4 py-3">
                                    <h3 className="text-sm font-semibold">
                                        Recent Activity
                                    </h3>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[120px]">
                                                Date
                                            </TableHead>
                                            <TableHead className="w-[100px]">
                                                Time
                                            </TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Source</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDateFull(
                                                        log.punched_at.split(
                                                            'T',
                                                        )[0],
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {fmtTime(log.punched_at)}
                                                </TableCell>
                                                <TableCell>
                                                    {logTypeLabel(log.type)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-muted-foreground text-xs">
                                                        {logSourceLabel(
                                                            log.source,
                                                        )}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {myTodaySheet ? (
                            <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-4">
                                <div>
                                    <p className="text-muted-foreground">
                                        Punch In
                                    </p>
                                    <p className="font-medium">
                                        {fmtTime(myTodaySheet.time_in)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Punch Out
                                    </p>
                                    <p className="font-medium">
                                        {fmtTime(myTodaySheet.time_out)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Gross Pay
                                    </p>
                                    <p className="font-medium">
                                        {formatCurrency(myTodaySheet.gross_pay)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">
                                        Late / OT
                                    </p>
                                    <p className="font-medium">
                                        {myTodaySheet.late_minutes > 0 ? (
                                            <span className="text-destructive">
                                                {myTodaySheet.late_minutes}m
                                                late
                                            </span>
                                        ) : (
                                            '-'
                                        )}
                                        {myTodaySheet.late_minutes > 0 &&
                                            myTodaySheet.overtime_minutes > 0 &&
                                            ' / '}
                                        {myTodaySheet.overtime_minutes > 0 ? (
                                            <span className="text-green-600 dark:text-green-400">
                                                {myTodaySheet.overtime_minutes}m
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

                {/* Pending Requests */}
                <div>
                    <h2 className="text-lg font-semibold">Pending Requests</h2>
                    <p className="text-sm text-muted-foreground">
                        Items requiring your approval
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                        label="Overtime"
                        value={pending.overtime}
                        icon={Timer}
                        color={
                            pending.overtime > 0
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                        }
                    />
                    <StatCard
                        label="Leaves"
                        value={pending.leaves}
                        icon={Umbrella}
                        color={
                            pending.leaves > 0
                                ? 'bg-blue-500'
                                : 'bg-emerald-500'
                        }
                    />
                    <StatCard
                        label="Corrections"
                        value={pending.corrections}
                        icon={Pencil}
                        color={
                            pending.corrections > 0
                                ? 'bg-purple-500'
                                : 'bg-emerald-500'
                        }
                    />
                    <StatCard
                        label="Cash Advances"
                        value={pending.cash_advances}
                        icon={Banknote}
                        color={
                            pending.cash_advances > 0
                                ? 'bg-cyan-500'
                                : 'bg-emerald-500'
                        }
                    />
                    <StatCard
                        label="Fines"
                        value={pending.fines}
                        icon={Ban}
                        color={
                            pending.fines > 0 ? 'bg-red-500' : 'bg-emerald-500'
                        }
                    />
                </div>

                {/* Today's Overall Attendance */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users className="size-5 text-muted-foreground" />
                            <CardTitle className="text-base">
                                Today's Attendance
                            </CardTitle>
                        </div>
                        <CardDescription>
                            {totalEmployees} active employees — {todayTotal}{' '}
                            sheet records today
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <AttendanceStat
                            label="Present"
                            value={todayAttendance.present}
                            total={todayTotal}
                            color="bg-emerald-500"
                        />
                        <AttendanceStat
                            label="Late"
                            value={todayAttendance.late}
                            total={todayTotal}
                            color="bg-amber-500"
                        />
                        <AttendanceStat
                            label="Absent"
                            value={todayAttendance.absent}
                            total={todayTotal}
                            color="bg-red-500"
                        />
                        <AttendanceStat
                            label="On Leave"
                            value={todayAttendance.on_leave}
                            total={todayTotal}
                            color="bg-blue-500"
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
