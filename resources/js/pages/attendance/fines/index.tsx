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
import { index, store } from '@/routes/fines';
import type { Auth } from '@/types';

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
};

type Fine = {
    id: number;
    employee: Employee;
    date: string;
    fine_type: string;
    amount: number;
    reason: string;
    marker: Employee;
    created_at: string;
};

type PaginatedData = {
    data: Fine[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
};

type PageProps = {
    auth: Auth;
    fines: PaginatedData;
    employees: Array<Employee>;
};

export default function Fines({ fines, employees = [] }: PageProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const userRole = (auth.user.role as string) ?? '';
    const isAdmin = ['admin', 'approver'].includes(userRole);
    const [employeeFilter, setEmployeeFilter] = useState('');
    const [fineTypeFilter, setFineTypeFilter] = useState('');
    const [createOpen, setCreateOpen] = useState(false);

    const formatCurrency = (amount: number | string | null) => {
        return `₱${Number(amount || 0).toFixed(2)}`;
    };

    const { formatDate } = useDateFormatter();

    return (
        <>
            <Head title="Fines" />
            <div className="space-y-6">
                <Heading
                    title="Fines"
                    description="Record and manage employee fines"
                />

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Records</CardTitle>
                        {isAdmin && (
                            <Dialog
                                open={createOpen}
                                onOpenChange={setCreateOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button size="sm">Record Fine</Button>
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
                                                        Record Fine
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Issue a new fine to an
                                                        employee.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="fine_employee_id">
                                                            Employee
                                                        </Label>
                                                        <Select
                                                            name="employee_id"
                                                            required
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select employee" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {employees.map(
                                                                    (emp) => (
                                                                        <SelectItem
                                                                            key={
                                                                                emp.id
                                                                            }
                                                                            value={emp.id.toString()}
                                                                        >
                                                                            {
                                                                                emp.first_name
                                                                            }{' '}
                                                                            {
                                                                                emp.last_name
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
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
                                                        <Label htmlFor="fine_type">
                                                            Fine Type
                                                        </Label>
                                                        <Input
                                                            id="fine_type"
                                                            type="text"
                                                            name="fine_type"
                                                            required
                                                            placeholder="e.g., tardiness, uniform, etc."
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="amount">
                                                            Amount
                                                        </Label>
                                                        <Input
                                                            id="amount"
                                                            type="number"
                                                            name="amount"
                                                            required
                                                            min={0}
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
                                                        Record Fine
                                                    </Button>
                                                </DialogFooter>
                                            </>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-wrap gap-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="fine_type_filter">
                                    Fine Type
                                </Label>
                                <Input
                                    id="fine_type_filter"
                                    placeholder="Filter by type..."
                                    value={fineTypeFilter}
                                    onChange={(e) =>
                                        setFineTypeFilter(e.target.value)
                                    }
                                    className="w-40"
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Employee</Label>
                                <Select
                                    value={employeeFilter}
                                    onValueChange={setEmployeeFilter}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="All employees" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All employees
                                        </SelectItem>
                                        {employees.map((emp) => (
                                            <SelectItem
                                                key={emp.id}
                                                value={emp.id.toString()}
                                            >
                                                {emp.first_name} {emp.last_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const params = new URLSearchParams();

                                        if (
                                            employeeFilter &&
                                            employeeFilter !== 'all'
                                        ) {
                                            params.set(
                                                'employee_id',
                                                employeeFilter,
                                            );
                                        }

                                        if (fineTypeFilter) {
                                            params.set(
                                                'fine_type',
                                                fineTypeFilter,
                                            );
                                        }

                                        window.location.href = `${index.url()}?${params.toString()}`;
                                    }}
                                >
                                    Filter
                                </Button>
                            </div>
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
                                        <th className="px-4 py-2 text-right font-medium">
                                            Amount
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Reason
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium">
                                            Marked By
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fines.data.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-8 text-center text-muted-foreground"
                                            >
                                                No fines found.
                                            </td>
                                        </tr>
                                    ) : (
                                        fines.data.map((fine) => (
                                            <tr
                                                key={fine.id}
                                                className="border-b"
                                            >
                                                <td className="px-4 py-2">
                                                    {formatDate(fine.date)}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {fine.employee
                                                        ? `${fine.employee.first_name} ${fine.employee.last_name}`
                                                        : 'N/A'}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <Badge variant="outline">
                                                        {fine.fine_type}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {formatCurrency(
                                                        fine.amount,
                                                    )}
                                                </td>
                                                <td className="max-w-48 truncate px-4 py-2">
                                                    {fine.reason}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {fine.marker
                                                        ? `${fine.marker.first_name} ${fine.marker.last_name}`
                                                        : 'N/A'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {fines.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-1">
                                {fines.links.map((link, i) => (
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
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

Fines.layout = {
    breadcrumbs: [
        {
            title: 'Fines',
            href: index(),
        },
    ],
};
