import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
import { useDateFormatter } from '@/lib/date';

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const DAY_LABELS: Record<string, string> = {
    sun: 'Sunday',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday',
};

type Shift = {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    night_differential: boolean;
    rest_days: string[];
    sort_order: number;
};

type PageProps = {
    shifts: Shift[];
};

const extractTime = (datetime: string | undefined, fallback: string) =>
    datetime?.split('T')[1]?.slice(0, 5) ?? fallback;

export default function ShiftsIndex({ shifts }: PageProps) {
    const { formatTimeRaw } = useDateFormatter();
    const [addOpen, setAddOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);

    return (
        <>
            <Head title="Shifts" />

            <div className="mb-6 flex items-center justify-between">
                <Heading
                    title="Shifts"
                    description="Manage shift templates for employees"
                />
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button>Add Shift</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Shift</DialogTitle>
                            <DialogDescription>
                                Create a new shift template.
                            </DialogDescription>
                        </DialogHeader>

                        <Form
                            action="/payroll/shifts"
                            method="post"
                            onSuccess={() => setAddOpen(false)}
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            required
                                            placeholder="e.g. Morning Shift"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="start_time">
                                            Start Time
                                        </Label>
                                        <Input
                                            id="start_time"
                                            type="time"
                                            name="start_time"
                                            required
                                            defaultValue="06:00"
                                        />
                                        <InputError
                                            message={errors.start_time}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="end_time">
                                            End Time
                                        </Label>
                                        <Input
                                            id="end_time"
                                            type="time"
                                            name="end_time"
                                            required
                                            defaultValue="14:00"
                                        />
                                        <InputError message={errors.end_time} />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="night_differential"
                                            name="night_differential"
                                            value="1"
                                            className="rounded border-gray-300"
                                        />
                                        <Label htmlFor="night_differential">
                                            Night Differential
                                        </Label>
                                    </div>
                                    <p className="-mt-3 ml-6 text-xs text-muted-foreground">
                                        10% premium for hours between 10PM-6AM
                                    </p>

                                    <fieldset className="grid gap-2">
                                        <legend className="text-sm font-medium">
                                            Rest Days
                                        </legend>
                                        <div className="grid grid-cols-2 gap-1">
                                            {DAY_NAMES.map((day) => (
                                                <label
                                                    key={day}
                                                    className="flex items-center gap-2 text-sm"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="rest_days[]"
                                                        value={day}
                                                        className="rounded border-gray-300"
                                                    />
                                                    {DAY_LABELS[day]}
                                                </label>
                                            ))}
                                        </div>
                                        <InputError
                                            message={errors.rest_days}
                                        />
                                    </fieldset>

                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Create Shift
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Shifts</CardTitle>
                </CardHeader>
                <CardContent>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="pb-3 font-medium text-muted-foreground">
                                    Name
                                </th>
                                <th className="pb-3 font-medium text-muted-foreground">
                                    Start
                                </th>
                                <th className="pb-3 font-medium text-muted-foreground">
                                    End
                                </th>
                                <th className="pb-3 font-medium text-muted-foreground">
                                    Night Diff
                                </th>
                                <th className="pb-3 font-medium text-muted-foreground">
                                    Rest Days
                                </th>
                                <th className="pb-3 text-right font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {shifts.map((shift) => (
                                <tr
                                    key={shift.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="py-3 font-medium">
                                        {shift.name}
                                    </td>
                                    <td className="py-3">
                                        {formatTimeRaw(shift.start_time)}
                                    </td>
                                    <td className="py-3">
                                        {formatTimeRaw(shift.end_time)}
                                    </td>
                                    <td className="py-3">
                                        {shift.night_differential ? (
                                            <Badge className="border-indigo-200 bg-indigo-100 text-indigo-700">
                                                Yes
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                No
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="py-3 capitalize">
                                        {shift.rest_days.length > 0
                                            ? shift.rest_days
                                                  .map(
                                                      (d) => DAY_LABELS[d] ?? d,
                                                  )
                                                  .join(', ')
                                            : '—'}
                                    </td>
                                    <td className="py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setEditingShift(shift)
                                                }
                                            >
                                                Edit
                                            </Button>
                                            <Form
                                                action={`/payroll/shifts/${shift.id}`}
                                                method="post"
                                                transform={(data) => ({
                                                    ...data,
                                                    _method: 'DELETE',
                                                })}
                                            >
                                                {({
                                                    processing,
                                                }: {
                                                    processing: boolean;
                                                }) => (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        disabled={processing}
                                                    >
                                                        Delete
                                                    </Button>
                                                )}
                                            </Form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {shifts.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-8 text-center text-muted-foreground"
                                    >
                                        No shifts configured.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <Dialog
                open={editingShift !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingShift(null);
                    }
                }}
            >
                <DialogContent key={editingShift?.id ?? 'edit-dialog'}>
                    <DialogHeader>
                        <DialogTitle>Edit Shift</DialogTitle>
                        <DialogDescription>
                            Update shift details.
                        </DialogDescription>
                    </DialogHeader>

                    {editingShift && (
                        <Form
                            action={`/payroll/shifts/${editingShift.id}`}
                            method="post"
                            transform={(data) => ({
                                ...data,
                                _method: 'PUT',
                            })}
                            onSuccess={() => setEditingShift(null)}
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-name">Name</Label>
                                        <Input
                                            id="edit-name"
                                            name="name"
                                            required
                                            defaultValue={editingShift.name}
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-start_time">
                                            Start Time
                                        </Label>
                                        <Input
                                            id="edit-start_time"
                                            type="time"
                                            name="start_time"
                                            required
                                            defaultValue={extractTime(
                                                editingShift.start_time,
                                                '06:00',
                                            )}
                                        />
                                        <InputError
                                            message={errors.start_time}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-end_time">
                                            End Time
                                        </Label>
                                        <Input
                                            id="edit-end_time"
                                            type="time"
                                            name="end_time"
                                            required
                                            defaultValue={extractTime(
                                                editingShift.end_time,
                                                '14:00',
                                            )}
                                        />
                                        <InputError message={errors.end_time} />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="edit-night_differential"
                                            name="night_differential"
                                            value="1"
                                            className="rounded border-gray-300"
                                            defaultChecked={
                                                editingShift.night_differential
                                            }
                                        />
                                        <Label htmlFor="edit-night_differential">
                                            Night Differential
                                        </Label>
                                    </div>
                                    <p className="-mt-3 ml-6 text-xs text-muted-foreground">
                                        10% premium for hours between 10PM-6AM
                                    </p>

                                    <fieldset className="grid gap-2">
                                        <legend className="text-sm font-medium">
                                            Rest Days
                                        </legend>
                                        <div className="grid grid-cols-2 gap-1">
                                            {DAY_NAMES.map((day) => (
                                                <label
                                                    key={day}
                                                    className="flex items-center gap-2 text-sm"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="rest_days[]"
                                                        value={day}
                                                        className="rounded border-gray-300"
                                                        defaultChecked={editingShift.rest_days.includes(
                                                            day,
                                                        )}
                                                    />
                                                    {DAY_LABELS[day]}
                                                </label>
                                            ))}
                                        </div>
                                        <InputError
                                            message={errors.rest_days}
                                        />
                                    </fieldset>

                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setEditingShift(null)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Save Changes
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

ShiftsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Payroll',
            href: '/payroll',
        },
        {
            title: 'Shifts',
            href: '/payroll/shifts',
        },
    ],
};
