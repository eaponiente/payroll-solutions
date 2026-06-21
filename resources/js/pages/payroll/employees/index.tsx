import { Head, Link, router } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { FilterDropdown } from '@/components/filter-dropdown';
import type { FilterFieldDef } from '@/components/filter-dropdown';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index, create, show, edit, destroy } from '@/routes/employees';

type Employee = {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
    status: string;
    role: { id: number; name: string; slug: string } | null;
    location: string | null;
    current_daily_rate: number;
    created_at: string;
};

type PaginatedLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedData = {
    data: Employee[];
    links: PaginatedLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
};

type Props = {
    employees: PaginatedData;
};

const employeeFilterFields: FilterFieldDef[] = [
    { key: 'first_name', label: 'First Name', type: 'text' },
    { key: 'last_name', label: 'Last Name', type: 'text' },
    { key: 'location', label: 'Location', type: 'text' },
    {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
        ],
    },
];

export default function EmployeesIndex({ employees }: Props) {
    const [search, setSearch] = useState('');

    const handleApply = (filters: Record<string, string>, s: string) => {
        const params: Record<string, string> = {};

        if (s) {
            params.search = s;
        }

        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params[key] = value;
            }
        });
        router.get(index(), params, { preserveState: true, replace: true });
    };

    const handleClear = () => {
        setSearch('');
        router.get(index(), {}, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Employees" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Employees"
                        description="Manage employee records"
                    />
                    <div className="flex items-center gap-3">
                        <FilterDropdown
                            fields={employeeFilterFields}
                            onApply={handleApply}
                            onClear={handleClear}
                        />
                        <Link href={create()}>
                            <Button>Add Employee</Button>
                        </Link>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <Label htmlFor="search" className="sr-only">
                            Search
                        </Label>
                        <Input
                            id="search"
                            placeholder="Search by name or employee number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleApply({}, search);
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium">
                                    Emp #
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Location
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Daily Rate
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No employees found.
                                    </td>
                                </tr>
                            ) : (
                                employees.data.map((employee) => (
                                    <tr
                                        key={employee.id}
                                        className="border-b hover:bg-muted/30"
                                    >
                                        <td className="px-4 py-3 text-xs">
                                            {employee.employee_number}
                                        </td>
                                        <td className="px-4 py-3">
                                            {employee.first_name}{' '}
                                            {employee.last_name}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {employee.location || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {employee.current_daily_rate || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant={
                                                    employee.status === 'active'
                                                        ? 'default'
                                                        : 'destructive'
                                                }
                                            >
                                                {employee.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        Actions
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <Link
                                                        href={show(employee.id)}
                                                        as="button"
                                                        className="w-full"
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full justify-start"
                                                        >
                                                            View
                                                        </Button>
                                                    </Link>
                                                    <Link
                                                        href={edit(employee.id)}
                                                        as="button"
                                                        className="w-full"
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full justify-start"
                                                        >
                                                            Edit
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full justify-start text-destructive hover:text-destructive"
                                                        onClick={() => {
                                                            const form =
                                                                document.getElementById(
                                                                    `delete-employee-${employee.id}`,
                                                                ) as HTMLFormElement | null;
                                                            form?.submit();
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Form
                                                id={`delete-employee-${employee.id}`}
                                                {...destroy.form(employee.id)}
                                                className="hidden"
                                            >
                                                {() => null}
                                            </Form>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {employees.links.length > 0 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {employees.from ?? 0} to {employees.to ?? 0}{' '}
                            of {employees.total} results
                        </p>
                        <div className="flex gap-1">
                            {employees.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    preserveState
                                    className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : link.url
                                              ? 'hover:bg-accent hover:text-accent-foreground'
                                              : 'pointer-events-none text-muted-foreground'
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

EmployeesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Payroll',
            href: '/payroll',
        },
        {
            title: 'Employees',
            href: index(),
        },
    ],
};
