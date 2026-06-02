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
import { index, store, approve, deny } from '@/routes/corrections';
import type { Auth } from '@/types';

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
};

type CorrectionRequest = {
    id: number;
    employee: Employee;
    date: string;
    correction_type: string;
    requested_in: string | null;
    requested_out: string | null;
    reason: string;
    status: string;
    denial_reason: string | null;
    reviewer: Employee | null;
};

type PaginatedData = {
    data: CorrectionRequest[];
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

export default function Corrections({ requests }: PageProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const userRole = (auth.user.role as string) ?? '';
    const isAdmin = ['admin', 'approver'].includes(userRole);
    const [statusFilter, setStatusFilter] = useState('all');
    const [createOpen, setCreateOpen] = useState(false);
    const [denyOpen, setDenyOpen] = useState<number | null>(null);
    const [correctionType, setCorrectionType] = useState('missed_punch_in');
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

    const correctionTypeLabel = (type: string) => {
        switch (type) {
            case 'missed_punch_in':
                return 'Missed Punch In';
            case 'missed_punch_out':
                return 'Missed Punch Out';
            case 'time_adjustment':
                return 'Time Adjustment';
            case 'absent_to_present':
                return 'Absent to Present';
            default:
                return type;
        }
    };

    const showRequestedIn = (type: string) => {
        return [
            'missed_punch_in',
            'time_adjustment',
            'absent_to_present',
        ].includes(type);
    };

    const showRequestedOut = (type: string) => {
        return [
            'missed_punch_out',
            'time_adjustment',
            'absent_to_present',
        ].includes(type);
    };

    return (
        <>
            <Head title="Attendance Corrections" />
            <div className="space-y-6">
                <Heading
                    title="Attendance Corrections"
                    description="Request corrections for time records"
                />

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Requests</CardTitle>
                        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">Request Correction</Button>
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
                                                    Request Correction
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Submit a correction request
                                                    for a time record.
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
                                                    <Label htmlFor="correction_type">
                                                        Correction Type
                                                    </Label>
                                                    <Select
                                                        name="correction_type"
                                                        required
                                                        value={correctionType}
                                                        onValueChange={(v) =>
                                                            setCorrectionType(v)
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="missed_punch_in">
                                                                Missed Punch In
                                                            </SelectItem>
                                                            <SelectItem value="missed_punch_out">
                                                                Missed Punch Out
                                                            </SelectItem>
                                                            <SelectItem value="time_adjustment">
                                                                Time Adjustment
                                                            </SelectItem>
                                                            <SelectItem value="absent_to_present">
                                                                Absent to
                                                                Present
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {showRequestedIn(
                                                    correctionType,
                                                ) && (
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="requested_in">
                                                            Requested In
                                                        </Label>
                                                        <Input
                                                            id="requested_in"
                                                            type="time"
                                                            name="requested_in"
                                                            required
                                                        />
                                                    </div>
                                                )}
                                                {showRequestedOut(
                                                    correctionType,
                                                ) && (
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="requested_out">
                                                            Requested Out
                                                        </Label>
                                                        <Input
                                                            id="requested_out"
                                                            type="time"
                                                            name="requested_out"
                                                            required
                                                        />
                                                    </div>
                                                )}
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
                                            In
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Out
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
                                                No correction requests found.
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
                                                        {correctionTypeLabel(
                                                            request.correction_type,
                                                        )}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {request.requested_in ||
                                                        '-'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {request.requested_out ||
                                                        '-'}
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
                                                                                correction:
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
                                    {...deny.form({
                                        correction: denyOpen ?? 0,
                                    })}
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Deny Correction Request
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

Corrections.layout = {
    breadcrumbs: [
        {
            title: 'Attendance Corrections',
            href: index(),
        },
    ],
};
