import { Form, Head, router } from '@inertiajs/react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useDateFormatter } from '@/lib/date';

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const DAY_LABELS: Record<string, string> = {
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
};

const SHIFT_COLORS = [
    'border-blue-200 bg-blue-100 text-blue-700',
    'border-green-200 bg-green-100 text-green-700',
    'border-amber-200 bg-amber-100 text-amber-700',
    'border-purple-200 bg-purple-100 text-purple-700',
    'border-pink-200 bg-pink-100 text-pink-700',
    'border-teal-200 bg-teal-100 text-teal-700',
    'border-orange-200 bg-orange-100 text-orange-700',
    'border-cyan-200 bg-cyan-100 text-cyan-700',
    'border-rose-200 bg-rose-100 text-rose-700',
    'border-emerald-200 bg-emerald-100 text-emerald-700',
];

type ShiftInfo = {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    night_differential: boolean;
};

type Assignment = {
    id: number;
    employee_id: number;
    shift_id: number;
    date: string;
    shift: ShiftInfo;
};

type EmployeeInfo = {
    id: number;
    first_name: string;
    last_name: string;
};

type PageProps = {
    employees: EmployeeInfo[];
    shifts: ShiftInfo[];
    assignments: Assignment[];
    dateRange: { from: string; to: string };
};

const getShiftColor = (shiftId: number) =>
    SHIFT_COLORS[shiftId % SHIFT_COLORS.length];

const toDate = (dateStr: string) => new Date(dateStr + 'T00:00:00');

const addDays = (dateStr: string, days: number): string => {
    const d = toDate(dateStr);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    return `${y}-${m}-${dd}`;
};

const getWeekDates = (from: string): string[] => {
    const dates: string[] = [];

    for (let i = 0; i < 7; i++) {
        dates.push(addDays(from, i));
    }

    return dates;
};

const getWeekOffset = (from: string): { prev: string; next: string } => ({
    prev: addDays(from, -7),
    next: addDays(from, 7),
});

type EditingCell = {
    employeeId: number;
    date: string;
} | null;

export default function ShiftRoster({
    employees,
    shifts,
    assignments,
    dateRange,
}: PageProps) {
    const { formatDateMd } = useDateFormatter();
    const [bulkOpen, setBulkOpen] = useState(false);
    const [editingCell, setEditingCell] = useState<EditingCell>(null);

    const weekDates = getWeekDates(dateRange.from);
    const offset = getWeekOffset(dateRange.from);

    const assignmentMap = new Map<string, Assignment>();

    for (const a of assignments) {
        assignmentMap.set(`${a.employee_id}_${a.date.slice(0, 10)}`, a);
    }

    const navigateWeek = (fromDate: string) => {
        router.get(
            window.location.pathname,
            { from: fromDate },
            { preserveState: true, preserveScroll: true },
        );
    };

    const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');

    const assignFormRef = useRef<HTMLFormElement>(null);

    const submitAssignForm = (
        employeeId: number,
        date: string,
        shiftId: string,
        method: 'POST' | 'DELETE',
    ) => {
        const form = assignFormRef.current;

        if (!form) {
            return;
        }

        form.action = `/payroll/employees/${employeeId}/shift`;
        (form.elements.namedItem('shift_id') as HTMLInputElement).value =
            String(shiftId);
        (form.elements.namedItem('date') as HTMLInputElement).value = date;
        (form.elements.namedItem('_method') as HTMLInputElement).value =
            method === 'DELETE' ? 'DELETE' : '';
        form.requestSubmit();
    };

    const handleAssign = (
        employeeId: number,
        date: string,
        shiftId: string,
    ) => {
        setEditingCell(null);

        if (shiftId === '__unassign') {
            submitAssignForm(employeeId, date, '', 'DELETE');
        } else {
            submitAssignForm(employeeId, date, shiftId, 'POST');
        }
    };

    return (
        <>
            <Head title="Shift Roster" />

            <form ref={assignFormRef} method="POST" className="hidden">
                <input type="hidden" name="_token" value={csrfToken ?? ''} />
                <input type="hidden" name="shift_id" value="" />
                <input type="hidden" name="date" value="" />
                <input type="hidden" name="_method" value="" />
            </form>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Heading title="Shift Roster" />
                    <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                        <DialogTrigger asChild>
                            <Button>Bulk Assign</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Bulk Shift Assignment</DialogTitle>
                                <DialogDescription>
                                    Assign shifts to employees for a date range
                                    and selected days.
                                </DialogDescription>
                            </DialogHeader>
                            <Form
                                action="/payroll/shifts/bulk-assign"
                                method="post"
                                onSuccess={() => setBulkOpen(false)}
                                className="space-y-4"
                            >
                                {({ processing }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="bulk-employee">
                                                Employee
                                            </Label>
                                            <Select name="employee_id" required>
                                                <SelectTrigger id="bulk-employee">
                                                    <SelectValue placeholder="Select employee" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {employees.map((emp) => (
                                                        <SelectItem
                                                            key={emp.id}
                                                            value={String(
                                                                emp.id,
                                                            )}
                                                        >
                                                            {emp.first_name}{' '}
                                                            {emp.last_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="bulk-shift">
                                                Shift
                                            </Label>
                                            <Select name="shift_id" required>
                                                <SelectTrigger id="bulk-shift">
                                                    <SelectValue placeholder="Select shift" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {shifts.map((shift) => (
                                                        <SelectItem
                                                            key={shift.id}
                                                            value={String(
                                                                shift.id,
                                                            )}
                                                        >
                                                            {shift.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="bulk-from">
                                                    From
                                                </Label>
                                                <Input
                                                    id="bulk-from"
                                                    type="date"
                                                    name="date_from"
                                                    required
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="bulk-to">
                                                    To
                                                </Label>
                                                <Input
                                                    id="bulk-to"
                                                    type="date"
                                                    name="date_to"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <fieldset className="grid gap-2">
                                            <legend className="text-sm font-medium">
                                                Days of Week
                                            </legend>
                                            <div className="flex flex-wrap gap-3">
                                                {DAY_NAMES.map((day) => (
                                                    <label
                                                        key={day}
                                                        className="flex items-center gap-1.5 text-sm"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            name="days[]"
                                                            value={day}
                                                            className="rounded border-gray-300"
                                                        />
                                                        {DAY_LABELS[day]}
                                                    </label>
                                                ))}
                                            </div>
                                        </fieldset>

                                        <DialogFooter>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                Assign Shifts
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateWeek(offset.prev)}
                    >
                        <ChevronLeftIcon className="mr-1 size-4" />
                        Previous Week
                    </Button>
                    <span className="text-sm font-medium">
                        {formatDateMd(weekDates[0])} —{' '}
                        {formatDateMd(weekDates[6])}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateWeek(offset.next)}
                    >
                        Next Week
                        <ChevronRightIcon className="ml-1 size-4" />
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Roster</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                                        Employee
                                    </th>
                                    {weekDates.map((dateStr) => (
                                        <th
                                            key={dateStr}
                                            className="px-2 py-2 text-center font-medium text-muted-foreground"
                                        >
                                            <div>
                                                {
                                                    DAY_LABELS[
                                                        DAY_NAMES[
                                                            toDate(
                                                                dateStr,
                                                            ).getDay()
                                                        ]
                                                    ]
                                                }
                                            </div>
                                            <div className="text-xs">
                                                {formatDateMd(dateStr)}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {employees.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No employees found.
                                        </td>
                                    </tr>
                                )}
                                {employees.map((employee) => (
                                    <tr
                                        key={employee.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="px-2 py-2 font-medium">
                                            {employee.first_name}{' '}
                                            {employee.last_name}
                                        </td>
                                        {weekDates.map((dateStr) => {
                                            const key = `${employee.id}_${dateStr}`;
                                            const assignment =
                                                assignmentMap.get(key);
                                            const isEditing =
                                                editingCell?.employeeId ===
                                                    employee.id &&
                                                editingCell?.date === dateStr;

                                            return (
                                                <td
                                                    key={dateStr}
                                                    className="px-2 py-2 text-center"
                                                >
                                                    {isEditing ? (
                                                        <Select
                                                            defaultValue={
                                                                assignment
                                                                    ? String(
                                                                          assignment.shift_id,
                                                                      )
                                                                    : '__unassign'
                                                            }
                                                            onValueChange={(
                                                                v,
                                                            ) =>
                                                                handleAssign(
                                                                    employee.id,
                                                                    dateStr,
                                                                    v,
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger className="h-8 w-full min-w-28">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="__unassign">
                                                                    Unassigned
                                                                </SelectItem>
                                                                {shifts.map(
                                                                    (shift) => (
                                                                        <SelectItem
                                                                            key={
                                                                                shift.id
                                                                            }
                                                                            value={String(
                                                                                shift.id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                shift.name
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="w-full cursor-pointer"
                                                            onClick={() =>
                                                                setEditingCell({
                                                                    employeeId:
                                                                        employee.id,
                                                                    date: dateStr,
                                                                })
                                                            }
                                                        >
                                                            {assignment ? (
                                                                <Badge
                                                                    className={getShiftColor(
                                                                        assignment.shift_id,
                                                                    )}
                                                                >
                                                                    {
                                                                        assignment
                                                                            .shift
                                                                            .name
                                                                    }
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    —
                                                                </span>
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ShiftRoster.layout = {
    breadcrumbs: [
        {
            title: 'Payroll',
            href: '/payroll',
        },
        {
            title: 'Shifts',
            href: '/payroll/shifts',
        },
        {
            title: 'Roster',
            href: '/payroll/shifts/roster',
        },
    ],
};
