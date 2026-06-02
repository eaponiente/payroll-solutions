import { Head, Link } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
import { index as employeesIndex, show } from '@/routes/employees';
import { store as addSalary } from '@/routes/employees/salaries';

type SalaryRecord = {
    id: number;
    daily_rate: number;
    effective_date: string;
    end_date: string | null;
    notes: string | null;
};

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
};

type Props = {
    employee: Employee;
    salaries: SalaryRecord[];
};

export default function EmployeeSalaries({ employee, salaries }: Props) {
    const [addOpen, setAddOpen] = useState(false);

    return (
        <>
            <Head
                title={`${employee.first_name} ${employee.last_name} - Salaries`}
            />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        title={`${employee.first_name} ${employee.last_name}`}
                        description="Salary history"
                    />
                    <div className="flex gap-2">
                        <Link href={show(employee.id)}>
                            <Button variant="outline">Back to Employee</Button>
                        </Link>
                        <Dialog open={addOpen} onOpenChange={setAddOpen}>
                            <DialogTrigger asChild>
                                <Button>Add Salary</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Salary Record</DialogTitle>
                                    <DialogDescription>
                                        Add a new salary record for{' '}
                                        {employee.first_name}{' '}
                                        {employee.last_name}.
                                    </DialogDescription>
                                </DialogHeader>
                                <Form
                                    {...addSalary.form({
                                        employee: employee.id,
                                    })}
                                    onSuccess={() => {
                                        setAddOpen(false);
                                    }}
                                    className="space-y-4"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="grid gap-2">
                                                <Label htmlFor="daily_rate">
                                                    Daily Rate
                                                </Label>
                                                <Input
                                                    id="daily_rate"
                                                    name="daily_rate"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    required
                                                    placeholder="0.00"
                                                />
                                                <InputError
                                                    message={errors.daily_rate}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="effective_date">
                                                    Effective Date
                                                </Label>
                                                <Input
                                                    id="effective_date"
                                                    name="effective_date"
                                                    type="date"
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        errors.effective_date
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="notes">
                                                    Notes
                                                </Label>
                                                <Input
                                                    id="notes"
                                                    name="notes"
                                                    placeholder="Optional notes"
                                                />
                                                <InputError
                                                    message={errors.notes}
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    variant="outline"
                                                    type="button"
                                                    onClick={() => {
                                                        setAddOpen(false);
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    Add Salary
                                                </Button>
                                            </DialogFooter>
                                        </>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Salary History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {salaries && salaries.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left font-medium">
                                                Effective Date
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                End Date
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                Daily Rate
                                            </th>
                                            <th className="px-4 py-3 text-left font-medium">
                                                Notes
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salaries.map((salary) => (
                                            <tr
                                                key={salary.id}
                                                className="border-b hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3">
                                                    {salary.effective_date}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {salary.end_date ??
                                                        'Current'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    &#8369;
                                                    {Number(
                                                        salary.daily_rate || 0,
                                                    ).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {salary.notes ?? '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No salary records found.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

EmployeeSalaries.layout = {
    breadcrumbs: [
        {
            title: 'Payroll',
            href: '/payroll',
        },
        {
            title: 'Employees',
            href: employeesIndex(),
        },
        {
            title: 'View Employee',
            href: '#',
        },
        {
            title: 'Salaries',
            href: '#',
        },
    ],
};
