import { Form, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adjust } from '@/routes/attendance/sheets';

type Sheet = {
    id: number;
    employee_id: number;
    employee: {
        id: number;
        first_name: string;
        last_name: string;
        employee_number: string;
    };
    date: string;
    time_in: string | null;
    time_out: string | null;
    lunch_in: string | null;
    lunch_out: string | null;
};

const formatTime24 = (value: string | null, tz: string): string => {
    if (!value) {
        return '';
    }

    if (value.includes(':') && !value.includes('T') && !value.includes('-')) {
        return value.slice(0, 5);
    }

    try {
        const date = new Date(value);

        if (isNaN(date.getTime())) {
            return '';
        }

        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).formatToParts(date);

        let hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
        const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';

        if (hour === '24') {
            hour = '00';
        }

        return `${hour}:${minute}`;
    } catch {
        return '';
    }
};

export default function AdjustAttendanceDialog({
    sheet,
    onClose,
    formatDate,
}: {
    sheet: Sheet | null;
    onClose: () => void;
    formatDate: (d: string | null) => string;
}) {
    const { timezone } = usePage<{ timezone: string }>().props;
    const tz = timezone ?? 'Asia/Manila';

    if (!sheet) {
        return null;
    }

    const punchInDefault = formatTime24(sheet.time_in, tz);
    const punchOutDefault = formatTime24(sheet.time_out, tz);
    const lunchOutDefault = formatTime24(sheet.lunch_out, tz);
    const lunchInDefault = formatTime24(sheet.lunch_in, tz);

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adjust Attendance</DialogTitle>
                    <DialogDescription>
                        {sheet.employee.first_name} {sheet.employee.last_name} —{' '}
                        {formatDate(sheet.date)}
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...adjust.form({ sheet: sheet.id })}
                    className="space-y-4"
                    onSuccess={onClose}
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Punch In</Label>
                                    <Input
                                        name="punch_in"
                                        type="time"
                                        defaultValue={punchInDefault}
                                    />
                                    <InputError message={errors.punch_in} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Punch Out</Label>
                                    <Input
                                        name="punch_out"
                                        type="time"
                                        defaultValue={punchOutDefault}
                                    />
                                    <InputError message={errors.punch_out} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Lunch Out</Label>
                                    <Input
                                        name="lunch_out"
                                        type="time"
                                        defaultValue={lunchOutDefault}
                                    />
                                    <InputError message={errors.lunch_out} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Lunch In</Label>
                                    <Input
                                        name="lunch_in"
                                        type="time"
                                        defaultValue={lunchInDefault}
                                    />
                                    <InputError message={errors.lunch_in} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Adjustment Note</Label>
                                <Input
                                    name="note"
                                    required
                                    placeholder="Reason for adjustment"
                                />
                                <InputError message={errors.note} />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={processing}>
                                    Save Adjustment
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
