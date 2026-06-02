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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useDateFormatter } from '@/lib/date';
import { index, store, update, destroy } from '@/routes/holidays';

type Holiday = {
    id: number;
    name: string;
    date: string;
    type: 'regular' | 'special';
};

type PageProps = {
    holidays: Holiday[];
};

export default function HolidaysIndex({ holidays }: PageProps) {
    const [addOpen, setAddOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

    const { formatDate } = useDateFormatter();

    const typeBadge = (type: string) => {
        switch (type) {
            case 'regular':
                return (
                    <Badge className="border-blue-200 bg-blue-100 text-blue-700">
                        Regular (+100%)
                    </Badge>
                );
            case 'special':
                return (
                    <Badge className="border-amber-200 bg-amber-100 text-amber-700">
                        Special (+30%)
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{type}</Badge>;
        }
    };

    return (
        <>
            <Head title="Holidays" />

            <div className="mb-6 flex items-center justify-between">
                <Heading
                    title="Holidays"
                    description="Manage company holidays and their rates"
                />
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button>Add Holiday</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Holiday</DialogTitle>
                            <DialogDescription>
                                Create a new holiday entry.
                            </DialogDescription>
                        </DialogHeader>

                        <Form
                            {...store.form()}
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
                                            placeholder="e.g. New Year's Day"
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="date">Date</Label>
                                        <Input
                                            id="date"
                                            type="date"
                                            name="date"
                                            required
                                        />
                                        <InputError message={errors.date} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="type">Type</Label>
                                        <Select
                                            name="type"
                                            defaultValue="regular"
                                        >
                                            <SelectTrigger id="type">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="regular">
                                                    Regular (+100%)
                                                </SelectItem>
                                                <SelectItem value="special">
                                                    Special (+30%)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.type} />
                                    </div>

                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Add Holiday
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
                    <CardTitle>All Holidays</CardTitle>
                </CardHeader>
                <CardContent>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="pb-3 font-medium text-muted-foreground">
                                    Name
                                </th>
                                <th className="pb-3 font-medium text-muted-foreground">
                                    Date
                                </th>
                                <th className="pb-3 font-medium text-muted-foreground">
                                    Type
                                </th>
                                <th className="pb-3 text-right font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {holidays.map((holiday) => (
                                <tr
                                    key={holiday.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="py-3 font-medium">
                                        {holiday.name}
                                    </td>
                                    <td className="py-3">
                                        {formatDate(holiday.date)}
                                    </td>
                                    <td className="py-3">
                                        {typeBadge(holiday.type)}
                                    </td>
                                    <td className="py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setEditingHoliday(holiday)
                                                }
                                            >
                                                Edit
                                            </Button>
                                            <Form
                                                {...destroy.form({
                                                    holiday: holiday.id,
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
                            {holidays.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="py-8 text-center text-muted-foreground"
                                    >
                                        No holidays configured.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <Dialog
                open={editingHoliday !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingHoliday(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Holiday</DialogTitle>
                        <DialogDescription>
                            Update holiday details.
                        </DialogDescription>
                    </DialogHeader>

                    {editingHoliday && (
                        <Form
                            {...update.form({ holiday: editingHoliday.id })}
                            onSuccess={() => setEditingHoliday(null)}
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
                                            defaultValue={editingHoliday.name}
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-date">Date</Label>
                                        <Input
                                            id="edit-date"
                                            type="date"
                                            name="date"
                                            required
                                            defaultValue={editingHoliday.date}
                                        />
                                        <InputError message={errors.date} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-type">Type</Label>
                                        <Select
                                            name="type"
                                            defaultValue={editingHoliday.type}
                                        >
                                            <SelectTrigger id="edit-type">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="regular">
                                                    Regular (+100%)
                                                </SelectItem>
                                                <SelectItem value="special">
                                                    Special (+30%)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.type} />
                                    </div>

                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setEditingHoliday(null)
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

HolidaysIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin',
        },
        {
            title: 'Holidays',
            href: index(),
        },
    ],
};
