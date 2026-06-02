import { Head, Link, usePage } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { index as employeesIndex } from '@/routes/employees';
import { index } from '@/routes/payroll';
import { index as periodsIndex } from '@/routes/payroll/periods';

export default function PayrollDashboard() {
    const { auth } = usePage<{
        auth: {
            user: {
                role: string;
                employee: Record<string, unknown>;
            };
        };
    }>().props;

    return (
        <>
            <Head title="Payroll" />

            <div className="space-y-6">
                <Heading
                    title="Payroll"
                    description="Manage payroll periods, employees, and payslips"
                />

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Employees</CardTitle>
                            <CardDescription>
                                Manage your workforce
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href={employeesIndex()}>
                                <Button variant="outline" className="w-full">
                                    View Employees
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Payroll Periods</CardTitle>
                            <CardDescription>
                                Active and past pay periods
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href={periodsIndex()}>
                                <Button variant="outline" className="w-full">
                                    View Periods
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>
                                Common payroll tasks
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2">
                                <Link href={index()}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                    >
                                        Generate Payroll
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div className="space-y-4">
                    <Heading variant="small" title="Role Information" />
                    <p className="text-sm text-muted-foreground">
                        You are logged in as <strong>{auth.user.role}</strong>
                        {auth.user.employee && (
                            <>
                                {' '}
                                &mdash;{' '}
                                {typeof auth.user.employee === 'object' &&
                                auth.user.employee !== null &&
                                'first_name' in auth.user.employee
                                    ? `${(auth.user.employee as Record<string, string>).first_name} ${(auth.user.employee as Record<string, string>).last_name}`
                                    : 'Employee'}
                            </>
                        )}
                    </p>
                </div>
            </div>
        </>
    );
}

PayrollDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Payroll',
            href: index(),
        },
    ],
};
