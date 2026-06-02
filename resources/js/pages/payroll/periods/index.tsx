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
import { useDateFormatter } from '@/lib/date';
import { generate, show, approve, voidMethod } from '@/routes/payroll/periods';

type PayrollPeriod = {
    id: number;
    period_start: string;
    period_end: string;
    status: 'draft' | 'approved' | 'voided';
    approved_by: number | null;
    approved_at: string | null;
    approver: { id: number; first_name: string; last_name: string } | null;
    items_count?: number;
};

type PaginatedData = {
    data: PayrollPeriod[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
};

type PageProps = {
    periods: PaginatedData;
};

export default function PayrollPeriodsIndex({ periods }: PageProps) {
    const [dialogOpen, setDialogOpen] = useState(false);

    const { formatDate } = useDateFormatter();

    const statusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="border-green-200 bg-green-100 text-green-700">
                        {status}
                    </Badge>
                );
            case 'voided':
                return (
                    <Badge className="border-red-200 bg-red-100 text-red-700">
                        {status}
                    </Badge>
                );
            default:
                return (
                    <Badge className="border-gray-200 bg-gray-100 text-gray-700">
                        {status}
                    </Badge>
                );
        }
    };

    return (
        <>
            <Head title="Payroll Periods" />

            <Heading
                title="Payroll Periods"
                description="View and manage payroll periods"
            />

            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4"></div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>Generate Payroll Period</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate Payroll Period</DialogTitle>
                            <DialogDescription>
                                Select a date range to generate payroll items
                                for all employees.
                            </DialogDescription>
                        </DialogHeader>

                        <Form
                            {...generate.form()}
                            onSuccess={() => setDialogOpen(false)}
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="period_start">
                                            Period Start
                                        </Label>
                                        <Input
                                            id="period_start"
                                            type="date"
                                            name="period_start"
                                            required
                                        />
                                        <InputError
                                            message={errors.period_start}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="period_end">
                                            Period End
                                        </Label>
                                        <Input
                                            id="period_end"
                                            type="date"
                                            name="period_end"
                                            required
                                        />
                                        <InputError
                                            message={errors.period_end}
                                        />
                                    </div>

                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Generate
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
                    <CardTitle>
                        All Periods
                        {periods.total > 0 && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({periods.total} total)
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="pb-3 font-medium text-muted-foreground">
                                    Period
                                </th>
                                <th className="pb-3 font-medium text-muted-foreground">
                                    Status
                                </th>
                                <th className="pb-3 font-medium text-muted-foreground">
                                    Items
                                </th>
                                <th className="pb-3 text-right font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {periods.data.map((period) => (
                                <tr
                                    key={period.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="py-3">
                                        {formatDate(period.period_start)} –{' '}
                                        {formatDate(period.period_end)}
                                    </td>
                                    <td className="py-3">
                                        {statusBadge(period.status)}
                                    </td>
                                    <td className="py-3">
                                        {period.items_count ?? '-'}
                                    </td>
                                    <td className="py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={show({
                                                    period: period.id,
                                                })}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    View
                                                </Button>
                                            </Link>
                                            {period.status === 'draft' && (
                                                <>
                                                    <Form
                                                        {...approve.form({
                                                            period: period.id,
                                                        })}
                                                    >
                                                        {({
                                                            processing:
                                                                approving,
                                                        }) => (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                disabled={
                                                                    approving
                                                                }
                                                            >
                                                                Approve
                                                            </Button>
                                                        )}
                                                    </Form>
                                                    <Form
                                                        {...voidMethod.form({
                                                            period: period.id,
                                                        })}
                                                    >
                                                        {({
                                                            processing: voiding,
                                                        }) => (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                disabled={
                                                                    voiding
                                                                }
                                                            >
                                                                Void
                                                            </Button>
                                                        )}
                                                    </Form>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {periods.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="py-8 text-center text-muted-foreground"
                                    >
                                        No payroll periods found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {periods.links.length > 3 && (
                        <div className="mt-6 flex items-center justify-center gap-1">
                            {periods.links.map((link, i) =>
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
        </>
    );
}

PayrollPeriodsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Payroll',
            href: '/payroll',
        },
        {
            title: 'Periods',
            href: show.definition.url
                .replace(/\{period\}/, '')
                .replace(/\/+$/, ''),
        },
    ],
};
