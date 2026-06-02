import { Form, Head, Link } from '@inertiajs/react';
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
import { index as deminimisIndex } from '@/routes/deminimis';
import type { Auth } from '@/types';

type Benefit = {
    id: number;
    name: string;
    default_amount: number;
    frequency: string;
    is_active: boolean;
};

type Entry = {
    id: number;
    amount: number;
    date: string;
    payroll_period_id: number | null;
    employee: { id: number; first_name: string; last_name: string };
    benefit: { id: number; name: string };
};

type Props = {
    auth: Auth;
    benefits: Benefit[];
    entries: {
        data: Entry[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        total: number;
        current_page: number;
        last_page: number;
    };
};

const fmt = (v: number | string | null) => `₱${Number(v || 0).toFixed(2)}`;

export default function DeMinimisIndex({ benefits, entries }: Props) {
    const { formatDate } = useDateFormatter();
    const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);

    return (
        <>
            <Head title="De Minimis Benefits" />

            <div className="space-y-6">
                <Heading
                    title="De Minimis Benefits"
                    description="Manage tax-exempt benefit templates and employee entries"
                />

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Benefit Templates</CardTitle>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    Add Template
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Add Benefit Template
                                    </DialogTitle>
                                    <DialogDescription>
                                        Create a new de minimis benefit type.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form
                                    action="/payroll/deminimis/templates"
                                    method="post"
                                    className="space-y-4"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="t-name">
                                                    Name
                                                </Label>
                                                <Input
                                                    id="t-name"
                                                    name="name"
                                                    required
                                                />
                                                <InputError
                                                    message={errors.name}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="t-amount">
                                                    Default Amount (₱)
                                                </Label>
                                                <Input
                                                    id="t-amount"
                                                    name="default_amount"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        errors.default_amount
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="t-freq">
                                                    Frequency
                                                </Label>
                                                <Select
                                                    name="frequency"
                                                    defaultValue="monthly"
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="monthly">
                                                            Monthly
                                                        </SelectItem>
                                                        <SelectItem value="annual">
                                                            Annual
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={errors.frequency}
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    Create
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        {benefits.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No benefit templates defined.
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="pb-3 font-medium text-muted-foreground">
                                            Name
                                        </th>
                                        <th className="pb-3 text-right font-medium text-muted-foreground">
                                            Default
                                        </th>
                                        <th className="pb-3 font-medium text-muted-foreground">
                                            Frequency
                                        </th>
                                        <th className="pb-3 font-medium text-muted-foreground">
                                            Status
                                        </th>
                                        <th className="pb-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {benefits.map((b) => (
                                        <tr
                                            key={b.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-3 font-medium">
                                                {b.name}
                                            </td>
                                            <td className="py-3 text-right">
                                                {fmt(b.default_amount)}
                                            </td>
                                            <td className="py-3 capitalize">
                                                {b.frequency}
                                            </td>
                                            <td className="py-3">
                                                <Badge
                                                    variant={
                                                        b.is_active
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {b.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setEditingBenefit(b)
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            Benefit Entries
                            {entries.total > 0 && (
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    ({entries.total} total)
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="pb-3 font-medium text-muted-foreground">
                                        Date
                                    </th>
                                    <th className="pb-3 font-medium text-muted-foreground">
                                        Employee
                                    </th>
                                    <th className="pb-3 font-medium text-muted-foreground">
                                        Benefit
                                    </th>
                                    <th className="pb-3 text-right font-medium text-muted-foreground">
                                        Amount
                                    </th>
                                    <th className="pb-3 font-medium text-muted-foreground">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No benefit entries recorded.
                                        </td>
                                    </tr>
                                ) : (
                                    entries.data.map((e) => (
                                        <tr
                                            key={e.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-3">
                                                {formatDate(e.date)}
                                            </td>
                                            <td className="py-3">
                                                {e.employee.first_name}{' '}
                                                {e.employee.last_name}
                                            </td>
                                            <td className="py-3">
                                                {e.benefit?.name}
                                            </td>
                                            <td className="py-3 text-right">
                                                {fmt(e.amount)}
                                            </td>
                                            <td className="py-3">
                                                {e.payroll_period_id ? (
                                                    <Badge className="border-green-200 bg-green-100 text-green-700">
                                                        Included
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">
                                                        Pending
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {entries.links.length > 3 && (
                            <div className="mt-6 flex justify-center gap-1">
                                {entries.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            preserveScroll
                                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm ${
                                                link.active
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:bg-accent'
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="inline-flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ),
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog
                    open={editingBenefit !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingBenefit(null);
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Benefit Template</DialogTitle>
                        </DialogHeader>
                        {editingBenefit && (
                            <Form
                                action={`/payroll/deminimis/templates/${editingBenefit.id}`}
                                method="post"
                                className="space-y-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <input
                                            type="hidden"
                                            name="_method"
                                            value="PUT"
                                        />
                                        <div className="grid gap-2">
                                            <Label htmlFor="e-name">Name</Label>
                                            <Input
                                                id="e-name"
                                                name="name"
                                                defaultValue={
                                                    editingBenefit.name
                                                }
                                                required
                                            />
                                            <InputError message={errors.name} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="e-amount">
                                                Default Amount (₱)
                                            </Label>
                                            <Input
                                                id="e-amount"
                                                name="default_amount"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                defaultValue={
                                                    editingBenefit.default_amount
                                                }
                                                required
                                            />
                                            <InputError
                                                message={errors.default_amount}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="e-freq">
                                                    Frequency
                                                </Label>
                                                <Select
                                                    name="frequency"
                                                    defaultValue={
                                                        editingBenefit.frequency
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="monthly">
                                                            Monthly
                                                        </SelectItem>
                                                        <SelectItem value="annual">
                                                            Annual
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={errors.frequency}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="e-active">
                                                    Status
                                                </Label>
                                                <Select
                                                    name="is_active"
                                                    defaultValue={
                                                        editingBenefit.is_active
                                                            ? '1'
                                                            : '0'
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="1">
                                                            Active
                                                        </SelectItem>
                                                        <SelectItem value="0">
                                                            Inactive
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={errors.is_active}
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
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

DeMinimisIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin',
        },
        {
            title: 'De Minimis',
            href: deminimisIndex(),
        },
    ],
};
