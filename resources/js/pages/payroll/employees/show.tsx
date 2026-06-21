import { Head, Link, usePage } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useDateFormatter } from '@/lib/date';
import {
    edit,
    destroy,
    rehire,
    salaries,
    index as employeesIndex,
} from '@/routes/employees';

type ScheduleRecord = {
    id: number;
    schedule_start: string;
    schedule_end: string;
    rest_days: string[];
    effective_from: string;
    effective_to: string | null;
};

type SalaryRecord = {
    id: number;
    daily_rate: number;
    effective_date: string;
    end_date: string | null;
    notes: string | null;
};

type ShiftAssignmentRecord = {
    id: number;
    date: string;
    shift: {
        id: number;
        name: string;
        start_time: string;
        end_time: string;
    };
};

type Employee = {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    status: string;
    role: { id: number; name: string; slug: string } | null;
    position: string;
    hire_date: string;
    end_date: string | null;
    current_daily_rate: number;
    sss_number: string | null;
    philhealth_number: string | null;
    pagibig_number: string | null;
    tin_number: string | null;
    phone: string | null;
    address: string | null;
    location: string | null;
    salaries: SalaryRecord[];
    schedules: ScheduleRecord[];
    account?: {
        schedule_type: 'fixed' | 'shifting';
    };
    shift_assignments?: ShiftAssignmentRecord[];
    retroactive_payments?: Array<{
        id: number;
        description: string;
        amount: number;
        effective_from: string;
        effective_to: string;
        paid_at: string | null;
    }>;
    deminimis_entries?: Array<{
        id: number;
        amount: number;
        date: string;
        payroll_period_id: number | null;
        benefit: { name: string };
    }>;
};

type Props = {
    employee: Employee;
    deminimis_benefits?: Array<{
        id: number;
        name: string;
        default_amount: number;
    }>;
};

const extractTime = (datetime: string | undefined, fallback: string) =>
    datetime?.split('T')[1]?.slice(0, 5) ?? fallback;

export default function EmployeeShow({ employee, deminimis_benefits }: Props) {
    const { formatDate, formatTimeRaw } = useDateFormatter();
    const { scheduleType } = usePage<{ scheduleType: string }>().props;
    const [rehireOpen, setRehireOpen] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const isInactive = employee.status !== 'active';
    const fmtCurrency = (val: number | string | null) =>
        `₱${Number(val || 0).toFixed(2)}`;
    const latestSalary =
        employee.salaries.length > 0 ? employee.salaries[0] : null;

    return (
        <>
            <Head title={`${employee.first_name} ${employee.last_name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        title={`${employee.first_name} ${employee.last_name}`}
                        description={employee.employee_number}
                    />
                    <div className="flex gap-2">
                        <Link href={edit(employee.id)}>
                            <Button variant="outline">Edit</Button>
                        </Link>
                        <Link href={salaries(employee.id)}>
                            <Button variant="outline">View Salaries</Button>
                        </Link>
                        {isInactive && (
                            <Dialog
                                open={rehireOpen}
                                onOpenChange={setRehireOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button variant="outline">Rehire</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Rehire Employee
                                        </DialogTitle>
                                        <DialogDescription>
                                            Set a new daily rate and rehire date
                                            for {employee.first_name}{' '}
                                            {employee.last_name}.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form
                                        {...rehire.form({
                                            employee: employee.id,
                                        })}
                                        onSuccess={() => {
                                            setRehireOpen(false);
                                        }}
                                        className="space-y-4"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="daily_rate">
                                                        Daily Rate
                                                    </Label>
                                                    <Input
                                                        id="daily_rate"
                                                        name="daily_rate"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        required
                                                        placeholder="0.00"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.daily_rate
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="rehire_date">
                                                        Rehire Date
                                                    </Label>
                                                    <Input
                                                        id="rehire_date"
                                                        name="rehire_date"
                                                        type="date"
                                                        required
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.rehire_date
                                                        }
                                                    />
                                                </div>
                                                <DialogFooter>
                                                    <Button
                                                        variant="outline"
                                                        type="button"
                                                        onClick={() => {
                                                            setRehireOpen(
                                                                false,
                                                            );
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                    >
                                                        Confirm Rehire
                                                    </Button>
                                                </DialogFooter>
                                            </>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Employee Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Full Name
                                </dt>
                                <dd>
                                    {employee.first_name}{' '}
                                    {employee.middle_name
                                        ? `${employee.middle_name} `
                                        : ''}
                                    {employee.last_name}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Employee Number
                                </dt>
                                <dd>
                                    {employee.employee_number}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Status
                                </dt>
                                <dd>
                                    <Badge
                                        variant={
                                            employee.status === 'active'
                                                ? 'default'
                                                : 'destructive'
                                        }
                                    >
                                        {employee.status}
                                    </Badge>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Role
                                </dt>
                                <dd className="capitalize">
                                    {employee.role?.name ?? 'None'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Location
                                </dt>
                                <dd>{employee.location ?? 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Position
                                </dt>
                                <dd className="capitalize">
                                    {employee.position.replace(/_/g, ' ')}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Hire Date
                                </dt>
                                <dd>{formatDate(employee.hire_date)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    End Date
                                </dt>
                                <dd>
                                    {employee.end_date
                                        ? formatDate(employee.end_date)
                                        : 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Daily Rate
                                </dt>
                                <dd>
                                    &#8369;
                                    {Number(
                                        employee.current_daily_rate || 0,
                                    ).toFixed(2)}
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <Separator />

                <Card>
                    <CardHeader>
                        <CardTitle>Government IDs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    SSS Number
                                </dt>
                                <dd>{employee.sss_number ?? 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    PhilHealth Number
                                </dt>
                                <dd>{employee.philhealth_number ?? 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Pag-IBIG Number
                                </dt>
                                <dd>{employee.pagibig_number ?? 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    TIN
                                </dt>
                                <dd>{employee.tin_number ?? 'N/A'}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <Separator />

                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Phone
                                </dt>
                                <dd>{employee.phone ?? 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Address
                                </dt>
                                <dd>{employee.address ?? 'N/A'}</dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                {latestSalary && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Latest Salary</CardTitle>
                            <CardDescription>
                                Effective{' '}
                                {formatDate(latestSalary.effective_date)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                                <div>
                                    <dt className="text-sm text-muted-foreground">
                                        Daily Rate
                                    </dt>
                                    <dd>
                                        &#8369;
                                        {Number(
                                            latestSalary.daily_rate || 0,
                                        ).toFixed(2)}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-muted-foreground">
                                        End Date
                                    </dt>
                                    <dd>
                                        {latestSalary.end_date
                                            ? formatDate(latestSalary.end_date)
                                            : 'Current'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-muted-foreground">
                                        Notes
                                    </dt>
                                    <dd>{latestSalary.notes ?? 'None'}</dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Retroactive Payments</CardTitle>
                            <CardDescription>
                                Back pay adjustments for this employee
                            </CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    Add Retro Pay
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Add Retroactive Payment
                                    </DialogTitle>
                                    <DialogDescription>
                                        Record a back pay adjustment for a past
                                        date range.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form
                                    action={`/payroll/employees/${employee.id}/retroactive`}
                                    method="post"
                                    className="space-y-4"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="retro-desc">
                                                    Description
                                                </Label>
                                                <Input
                                                    id="retro-desc"
                                                    name="description"
                                                    required
                                                    placeholder="Salary adjustment for Jan-Mar"
                                                />
                                                <InputError
                                                    message={errors.description}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="retro-amount">
                                                    Amount (₱)
                                                </Label>
                                                <Input
                                                    id="retro-amount"
                                                    name="amount"
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    required
                                                />
                                                <InputError
                                                    message={errors.amount}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="retro-from">
                                                        Effective From
                                                    </Label>
                                                    <Input
                                                        id="retro-from"
                                                        name="effective_from"
                                                        type="date"
                                                        required
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.effective_from
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="retro-to">
                                                        Effective To
                                                    </Label>
                                                    <Input
                                                        id="retro-to"
                                                        name="effective_to"
                                                        type="date"
                                                        required
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.effective_to
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    Save
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {employee.retroactive_payments &&
                        employee.retroactive_payments.length > 0 ? (
                            <div className="space-y-3">
                                {employee.retroactive_payments.map(
                                    (rp: any) => (
                                        <div
                                            key={rp.id}
                                            className="flex items-center justify-between rounded-md border px-3 py-2"
                                        >
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {rp.description}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(
                                                        rp.effective_from,
                                                    )}{' '}
                                                    —{' '}
                                                    {formatDate(
                                                        rp.effective_to,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium">
                                                    {fmtCurrency(rp.amount)}
                                                </span>
                                                {!rp.paid_at && (
                                                    <Form
                                                        method="post"
                                                        action={`/payroll/employees/retroactive/${rp.id}`}
                                                    >
                                                        <input
                                                            type="hidden"
                                                            name="_method"
                                                            value="DELETE"
                                                        />
                                                        <Button
                                                            type="submit"
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            Remove
                                                        </Button>
                                                    </Form>
                                                )}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No retroactive payments recorded.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>De Minimis Benefits</CardTitle>
                            <CardDescription>
                                Tax-exempt benefits for this employee
                            </CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    Add Benefit
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Add De Minimis Benefit
                                    </DialogTitle>
                                    <DialogDescription>
                                        Record a tax-exempt benefit entry.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form
                                    action={`/payroll/employees/${employee.id}/deminimis`}
                                    method="post"
                                    className="space-y-4"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="dm-benefit">
                                                    Benefit Type
                                                </Label>
                                                <Select
                                                    name="deminimis_benefit_id"
                                                    required
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select benefit" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {deminimis_benefits?.map(
                                                            (b) => (
                                                                <SelectItem
                                                                    key={b.id}
                                                                    value={String(
                                                                        b.id,
                                                                    )}
                                                                >
                                                                    {b.name} (₱
                                                                    {
                                                                        b.default_amount
                                                                    }
                                                                    )
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={
                                                        errors.deminimis_benefit_id
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="dm-amount">
                                                    Amount (₱)
                                                </Label>
                                                <Input
                                                    id="dm-amount"
                                                    name="amount"
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    required
                                                />
                                                <InputError
                                                    message={errors.amount}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="dm-date">
                                                    Date
                                                </Label>
                                                <Input
                                                    id="dm-date"
                                                    name="date"
                                                    type="date"
                                                    required
                                                />
                                                <InputError
                                                    message={errors.date}
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    Save
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {employee.deminimis_entries &&
                        employee.deminimis_entries.length > 0 ? (
                            <div className="space-y-3">
                                {employee.deminimis_entries.map(
                                    (entry: any) => (
                                        <div
                                            key={entry.id}
                                            className="flex items-center justify-between rounded-md border px-3 py-2"
                                        >
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {entry.benefit?.name ??
                                                        'Benefit'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(entry.date)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium">
                                                    {fmtCurrency(entry.amount)}
                                                </span>
                                                {!entry.payroll_period_id && (
                                                    <Form
                                                        method="post"
                                                        action={`/payroll/employees/deminimis/${entry.id}`}
                                                    >
                                                        <input
                                                            type="hidden"
                                                            name="_method"
                                                            value="DELETE"
                                                        />
                                                        <Button
                                                            type="submit"
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            Remove
                                                        </Button>
                                                    </Form>
                                                )}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No de minimis benefits recorded.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Separator />

                {scheduleType === 'shifting' ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Work Schedule</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <dt className="text-sm text-muted-foreground">
                                    Schedule Type
                                </dt>
                                <dd>
                                    <Badge className="border-indigo-200 bg-indigo-100 text-indigo-700">
                                        Shifting
                                    </Badge>
                                </dd>
                            </div>

                            <div>
                                <dt className="mb-2 text-sm text-muted-foreground">
                                    Upcoming Shifts
                                </dt>
                                {employee.shift_assignments &&
                                employee.shift_assignments.length > 0 ? (
                                    <div className="grid gap-2">
                                        {employee.shift_assignments.map(
                                            (assignment) => (
                                                <div
                                                    key={assignment.id}
                                                    className="flex items-center justify-between rounded-md border px-3 py-2"
                                                >
                                                    <span className="text-sm">
                                                        {formatDate(
                                                            assignment.date,
                                                        )}
                                                    </span>
                                                    <Badge variant="outline">
                                                        {assignment.shift.name}
                                                    </Badge>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No upcoming shift assignments.
                                    </p>
                                )}
                            </div>

                            <Link
                                href={`/payroll/shifts/roster?employee_id=${employee.id}`}
                            >
                                <Button variant="outline" size="sm">
                                    View Shift Roster
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Work Schedule</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {employee.schedules.length > 0 ? (
                                <dl className="grid gap-4 sm:grid-cols-2 text-sm">
                                    <div>
                                        <dt className="text-sm text-muted-foreground">
                                            Start Time
                                        </dt>
                                        <dd>
                                            {formatTimeRaw(
                                                employee.schedules[0]
                                                    .schedule_start,
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-muted-foreground">
                                            End Time
                                        </dt>
                                        <dd>
                                            {formatTimeRaw(
                                                employee.schedules[0]
                                                    .schedule_end,
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-muted-foreground">
                                            Effective From
                                        </dt>
                                        <dd>
                                            {formatDate(
                                                employee.schedules[0]
                                                    .effective_from,
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-muted-foreground">
                                            Rest Days
                                        </dt>
                                        <dd className="capitalize">
                                            {employee.schedules[0].rest_days
                                                .length > 0
                                                ? employee.schedules[0].rest_days.join(
                                                      ', ',
                                                  )
                                                : 'None'}
                                        </dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No schedule set (defaults to 08:00–17:00,
                                    Sun rest).
                                </p>
                            )}

                            <Dialog
                                open={scheduleOpen}
                                onOpenChange={setScheduleOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-4"
                                    >
                                        Update Schedule
                                    </Button>
                                </DialogTrigger>
                                <DialogContent
                                    key={
                                        employee.schedules[0]?.id ??
                                        'no-schedule'
                                    }
                                >
                                    <DialogHeader>
                                        <DialogTitle>
                                            Update Work Schedule
                                        </DialogTitle>
                                    </DialogHeader>
                                    <Form
                                        action={`/payroll/employees/${employee.id}/schedule`}
                                        method="post"
                                        className="space-y-4"
                                        onSuccess={() => {
                                            setScheduleOpen(false);
                                        }}
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="schedule_start">
                                                        Start Time
                                                    </Label>
                                                    <Input
                                                        id="schedule_start"
                                                        name="schedule_start"
                                                        type="time"
                                                        required
                                                        defaultValue={extractTime(
                                                            employee
                                                                .schedules[0]
                                                                ?.schedule_start,
                                                            '08:00',
                                                        )}
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.schedule_start
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="schedule_end">
                                                        End Time
                                                    </Label>
                                                    <Input
                                                        id="schedule_end"
                                                        name="schedule_end"
                                                        type="time"
                                                        required
                                                        defaultValue={extractTime(
                                                            employee
                                                                .schedules[0]
                                                                ?.schedule_end,
                                                            '17:00',
                                                        )}
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.schedule_end
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="effective_from">
                                                        Effective From
                                                    </Label>
                                                    <Input
                                                        id="effective_from"
                                                        name="effective_from"
                                                        type="date"
                                                        required
                                                        defaultValue={
                                                            new Date()
                                                                .toISOString()
                                                                .split('T')[0]
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.effective_from
                                                        }
                                                    />
                                                </div>
                                                <fieldset className="grid gap-2">
                                                    <legend className="text-sm font-medium">
                                                        Rest Days
                                                    </legend>
                                                    <div className="grid grid-cols-2 gap-1">
                                                        {[
                                                            'sunday',
                                                            'monday',
                                                            'tuesday',
                                                            'wednesday',
                                                            'thursday',
                                                            'friday',
                                                            'saturday',
                                                        ].map((day) => (
                                                            <label
                                                                key={day}
                                                                className="flex items-center gap-2 text-sm"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    name="rest_days[]"
                                                                    value={day}
                                                                    className="rounded border-gray-300"
                                                                    defaultChecked={employee.schedules[0]?.rest_days?.includes(
                                                                        day,
                                                                    )}
                                                                />
                                                                {day
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                    day.slice(
                                                                        1,
                                                                    )}
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <InputError
                                                        message={
                                                            errors.rest_days
                                                        }
                                                    />
                                                </fieldset>
                                                <DialogFooter>
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                    >
                                                        Save Schedule
                                                    </Button>
                                                </DialogFooter>
                                            </>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                )}

                <Separator />

                <div className="flex gap-2">
                    <Form
                        {...destroy.form(employee.id)}
                        onSubmit={(e) => {
                            const confirmed = window.confirm(
                                `Are you sure you want to delete ${employee.first_name} ${employee.last_name}?`,
                            );

                            if (!confirmed) {
                                e.preventDefault();
                            }
                        }}
                    >
                        <Button variant="destructive" type="submit">
                            Delete Employee
                        </Button>
                    </Form>
                </div>
            </div>
        </>
    );
}

EmployeeShow.layout = {
    breadcrumbs: [
        {
            title: 'Payroll',
            href: '/payroll',
        },
        {
            title: 'Employees',
            href: employeesIndex(),
        },
        {
            title: 'View Employee',
            href: '#',
        },
    ],
};
