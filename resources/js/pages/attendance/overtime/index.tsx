import { Form, Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
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
import { index, store, approve, deny } from '@/routes/overtime';
import type { Auth } from '@/types';

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
};

type OvertimeRequest = {
    id: number;
    employee: Employee;
    date: string;
    requested_minutes: number;
    reason: string;
    shift_type: string;
    status: string;
    approved_by: number | null;
    approved_at: string | null;
    denial_reason: string | null;
    approver: Employee | null;
    ot_amount_30min: number;
    ot_amount_1hour: number;
};

type PaginatedData = {
    data: OvertimeRequest[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
};

type PageProps = {
    auth: Auth;
    requests: PaginatedData;
};

export default function Overtime({ requests }: PageProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const userRole = (auth.user.role as string) ?? '';
    const isAdmin = ['admin', 'approver'].includes(userRole);
    const [statusFilter, setStatusFilter] = useState('all');
    const [createOpen, setCreateOpen] = useState(false);
    const [denyOpen, setDenyOpen] = useState<number | null>(null);
    const { formatDate } = useDateFormatter();

    const statusVariant = (status: string) => {
        switch (status) {
            case 'pending':
                return 'secondary' as const;
            case 'approved':
                return 'default' as const;
            case 'denied':
                return 'destructive' as const;
            default:
                return 'outline' as const;
        }
    };

    const shiftTypeLabel = (type: string) => {
        switch (type) {
            case 'regular_day':
                return 'Regular Day';
            case 'rest_day':
                return 'Rest Day';
            case 'regular_holiday':
                return 'Regular Holiday';
            case 'special_holiday':
                return 'Special Holiday';
            default:
                return type;
        }
    };

    return (
        <>
            <Head title="Overtime Requests" />
            <div className="space-y-6">
                <Heading
                    title="Overtime Requests"
                    description="Manage overtime requests and approvals"
                />

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Requests</CardTitle>
                        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">Request OT</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <Form
                                    {...store.form()}
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Request Overtime
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Submit an overtime request
                                                    for approval.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="date">
                                                        Date
                                                    </Label>
                                                    <Input
                                                        id="date"
                                                        type="date"
                                                        name="date"
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="requested_minutes">
                                                        Minutes Requested
                                                    </Label>
                                                    <Input
                                                        id="requested_minutes"
                                                        type="number"
                                                        name="requested_minutes"
                                                        required
                                                        min={1}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="shift_type">
                                                        Shift Type
                                                    </Label>
                                                    <Select
                                                        name="shift_type"
                                                        required
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select shift type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="regular_day">
                                                                Regular Day
                                                            </SelectItem>
                                                            <SelectItem value="rest_day">
                                                                Rest Day
                                                            </SelectItem>
                                                            <SelectItem value="regular_holiday">
                                                                Regular Holiday
                                                            </SelectItem>
                                                            <SelectItem value="special_holiday">
                                                                Special Holiday
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="reason">
                                                        Reason
                                                    </Label>
                                                    <textarea
                                                        id="reason"
                                                        name="reason"
                                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    Submit Request
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="approved">
                                        Approved
                                    </SelectItem>
                                    <SelectItem value="denied">
                                        Denied
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-2 text-left font-medium">
                                            Date
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Employee
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Shift
                                        </th>
                                        <th className="px-4 py-2 text-right font-medium">
                                            Minutes
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Reason
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Status
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                No overtime requests found.
                                            </td>
                                        </tr>
                                    ) : (
                                        requests.data.map((request) => (
                                            <tr
                                                key={request.id}
                                                className="border-b"
                                            >
                                                <td className="px-4 py-2">
                                                    {formatDate(request.date)}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {request.employee
                                                        ? `${request.employee.first_name} ${request.employee.last_name}`
                                                        : 'N/A'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {shiftTypeLabel(
                                                        request.shift_type,
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {request.requested_minutes}
                                                </td>
                                                <td className="max-w-48 truncate px-4 py-2">
                                                    {request.reason}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Badge
                                                        variant={statusVariant(
                                                            request.status,
                                                        )}
                                                    >
                                                        {request.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="flex gap-1">
                                                        {isAdmin &&
                                                            request.status ===
                                                                'pending' && (
                                                                <>
                                                                    <Form
                                                                        {...approve.form(
                                                                            {
                                                                                overtime:
                                                                                    request.id,
                                                                            },
                                                                        )}
                                                                        options={{
                                                                            preserveScroll: true,
                                                                        }}
                                                                    >
                                                                        {({
                                                                            processing,
                                                                        }) => (
                                                                            <Button
                                                                                type="submit"
                                                                                size="sm"
                                                                                variant="default"
                                                                                disabled={
                                                                                    processing
                                                                                }
                                                                            >
                                                                                Approve
                                                                            </Button>
                                                                        )}
                                                                    </Form>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() =>
                                                                            setDenyOpen(
                                                                                request.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        Deny
                                                                    </Button>
                                                                </>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {requests.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-1">
                                {requests.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) {
                                                window.location.href = link.url;
                                            }
                                        }}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        <Dialog
                            open={denyOpen !== null}
                            onOpenChange={() => setDenyOpen(null)}
                        >
                            <DialogContent>
                                <Form
                                    {...deny.form({ overtime: denyOpen ?? 0 })}
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Deny Overtime Request
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Provide a reason for denying
                                                    this request.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="denial_reason">
                                                        Reason
                                                    </Label>
                                                    <textarea
                                                        id="denial_reason"
                                                        name="denial_reason"
                                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    type="submit"
                                                    variant="destructive"
                                                    disabled={processing}
                                                >
                                                    Deny Request
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Overtime.layout = {
    breadcrumbs: [
        {
            title: 'Overtime Requests',
            href: index(),
        },
    ],
};
