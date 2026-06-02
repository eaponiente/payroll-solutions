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
import { index, store, approve, deny } from '@/routes/cash-advances';
import type { Auth } from '@/types';

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
};

type CashAdvance = {
    id: number;
    employee: Employee;
    amount: number;
    remaining_balance: number;
    reason: string;
    status: string;
    approved_by: number | null;
    approved_at: string | null;
    denial_reason: string | null;
    approver: Employee | null;
    created_at: string;
};

type PaginatedData = {
    data: CashAdvance[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
};

type PageProps = {
    auth: Auth;
    advances: PaginatedData;
};

export default function CashAdvances({ advances }: PageProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const userRole = (auth.user.role as string) ?? '';
    const isAdmin = ['admin', 'approver'].includes(userRole);
    const [statusFilter, setStatusFilter] = useState('all');
    const [createOpen, setCreateOpen] = useState(false);
    const [denyOpen, setDenyOpen] = useState<number | null>(null);

    const formatCurrency = (amount: number | string | null) => {
        return `₱${Number(amount || 0).toFixed(2)}`;
    };

    const { formatDate } = useDateFormatter();

    const statusVariant = (status: string) => {
        switch (status) {
            case 'pending':
                return 'secondary' as const;
            case 'approved':
                return 'default' as const;
            case 'denied':
                return 'destructive' as const;
            case 'unpaid':
                return 'secondary' as const;
            case 'paid':
                return 'default' as const;
            default:
                return 'outline' as const;
        }
    };

    return (
        <>
            <Head title="Cash Advances" />
            <div className="space-y-6">
                <Heading
                    title="Cash Advances"
                    description="Request and manage cash advances"
                />

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Advances</CardTitle>
                        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">Request Cash Advance</Button>
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
                                                    Request Cash Advance
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Submit a cash advance
                                                    request for approval.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="amount">
                                                        Amount
                                                    </Label>
                                                    <Input
                                                        id="amount"
                                                        type="number"
                                                        name="amount"
                                                        required
                                                        min={1}
                                                        step="0.01"
                                                    />
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
                                    <SelectItem value="unpaid">
                                        Unpaid
                                    </SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
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
                                        <th className="px-4 py-2 text-right font-medium">
                                            Amount
                                        </th>
                                        <th className="px-4 py-2 text-right font-medium">
                                            Remaining
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
                                    {advances.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                No cash advances found.
                                            </td>
                                        </tr>
                                    ) : (
                                        advances.data.map((advance) => (
                                            <tr
                                                key={advance.id}
                                                className="border-b"
                                            >
                                                <td className="px-4 py-2">
                                                    {formatDate(
                                                        advance.created_at,
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {advance.employee
                                                        ? `${advance.employee.first_name} ${advance.employee.last_name}`
                                                        : 'N/A'}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {formatCurrency(
                                                        advance.amount,
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {formatCurrency(
                                                        advance.remaining_balance,
                                                    )}
                                                </td>
                                                <td className="max-w-48 truncate px-4 py-2">
                                                    {advance.reason}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Badge
                                                        variant={statusVariant(
                                                            advance.status,
                                                        )}
                                                    >
                                                        {advance.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="flex gap-1">
                                                        {isAdmin &&
                                                            advance.status ===
                                                                'pending' && (
                                                                <>
                                                                    <Form
                                                                        {...approve.form(
                                                                            {
                                                                                cashAdvance:
                                                                                    advance.id,
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
                                                                                advance.id,
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

                        {advances.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-1">
                                {advances.links.map((link, i) => (
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
                                        cashAdvance: denyOpen ?? 0,
                                    })}
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Deny Cash Advance
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

CashAdvances.layout = {
    breadcrumbs: [
        {
            title: 'Cash Advances',
            href: index(),
        },
    ],
};
