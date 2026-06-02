import { Form, Head, usePage } from '@inertiajs/react';
import { CheckIcon, XIcon } from 'lucide-react';
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
import { index, store, approve, deny } from '@/routes/leave';
import type { Auth } from '@/types';

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
    leaves_used_this_year?: number;
};

type LeaveRequest = {
    id: number;
    employee: Employee;
    date: string;
    leave_type: string;
    duration: string;
    reason: string;
    is_paid: boolean;
    status: string;
    approved_by: number | null;
    approved_at: string | null;
    denial_reason: string | null;
    approver: Employee | null;
};

type PaginatedData = {
    data: LeaveRequest[];
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

export default function Leaves({ requests }: PageProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const userRole = (auth.user.role as string) ?? '';
    const isAdmin = ['admin', 'approver'].includes(userRole);
    const employee = auth.user.employee as Record<string, unknown> | undefined;
    const leavesUsed = (employee?.leaves_used_this_year as number) ?? 0;
    const leavesRemaining = 5 - leavesUsed;
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

    const leaveTypeLabel = (type: string) => {
        switch (type) {
            case 'vacation':
                return 'Vacation';
            case 'sick':
                return 'Sick';
            case 'emergency':
                return 'Emergency';
            case 'maternity':
                return 'Maternity';
            case 'paternity':
                return 'Paternity';
            case 'bereavement':
                return 'Bereavement';
            case 'unpaid':
                return 'Unpaid';
            default:
                return type;
        }
    };

    const durationLabel = (duration: string) => {
        switch (duration) {
            case 'full_day':
                return 'Full Day';
            case 'half_day_am':
                return 'Half Day (AM)';
            case 'half_day_pm':
                return 'Half Day (PM)';
            default:
                return duration;
        }
    };

    return (
        <>
            <Head title="Leave Requests" />
            <div className="space-y-6">
                <Heading
                    title="Leave Requests"
                    description="Manage leave requests and approvals"
                />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">
                                Leaves Used
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {leavesUsed} / 5
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {leavesRemaining} remaining
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Requests</CardTitle>
                        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">Request Leave</Button>
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
                                                    Request Leave
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Submit a leave request for
                                                    approval.
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
                                                    <Label htmlFor="leave_type">
                                                        Leave Type
                                                    </Label>
                                                    <Select
                                                        name="leave_type"
                                                        required
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select leave type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="vacation">
                                                                Vacation
                                                            </SelectItem>
                                                            <SelectItem value="sick">
                                                                Sick
                                                            </SelectItem>
                                                            <SelectItem value="emergency">
                                                                Emergency
                                                            </SelectItem>
                                                            <SelectItem value="maternity">
                                                                Maternity
                                                            </SelectItem>
                                                            <SelectItem value="paternity">
                                                                Paternity
                                                            </SelectItem>
                                                            <SelectItem value="bereavement">
                                                                Bereavement
                                                            </SelectItem>
                                                            <SelectItem value="unpaid">
                                                                Unpaid
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="duration">
                                                        Duration
                                                    </Label>
                                                    <Select
                                                        name="duration"
                                                        required
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select duration" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="full_day">
                                                                Full Day
                                                            </SelectItem>
                                                            <SelectItem value="half_day_am">
                                                                Half Day (AM)
                                                            </SelectItem>
                                                            <SelectItem value="half_day_pm">
                                                                Half Day (PM)
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
                                            Type
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Duration
                                        </th>
                                        <th className="px-4 py-2 text-center font-medium">
                                            Paid
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
                                                colSpan={8}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                No leave requests found.
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
                                                    <Badge variant="outline">
                                                        {leaveTypeLabel(
                                                            request.leave_type,
                                                        )}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {durationLabel(
                                                        request.duration,
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    {request.is_paid ? (
                                                        <CheckIcon className="mx-auto size-4 text-green-500" />
                                                    ) : (
                                                        <XIcon className="mx-auto size-4 text-red-500" />
                                                    )}
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
                                                                                leave: request.id,
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
                                    {...deny.form({ leave: denyOpen ?? 0 })}
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Deny Leave Request
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

Leaves.layout = {
    breadcrumbs: [
        {
            title: 'Leave Requests',
            href: index(),
        },
    ],
};
