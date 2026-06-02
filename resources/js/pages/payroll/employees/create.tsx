import { Head } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { store, index as employeesIndex } from '@/routes/employees';

type Role = {
    id: number;
    name: string;
    slug: string;
};

type Props = {
    roles: Role[];
};

export default function EmployeeCreate({ roles }: Props) {
    return (
        <>
            <Head title="Add Employee" />

            <div className="space-y-6">
                <Heading
                    title="Add Employee"
                    description="Create a new employee record"
                />

                <Form {...store.form()} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>
                                        Basic employee details
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="first_name">
                                                First Name
                                            </Label>
                                            <Input
                                                id="first_name"
                                                name="first_name"
                                                required
                                                placeholder="First name"
                                            />
                                            <InputError
                                                message={errors.first_name}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="last_name">
                                                Last Name
                                            </Label>
                                            <Input
                                                id="last_name"
                                                name="last_name"
                                                required
                                                placeholder="Last name"
                                            />
                                            <InputError
                                                message={errors.last_name}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="middle_name">
                                                Middle Name
                                            </Label>
                                            <Input
                                                id="middle_name"
                                                name="middle_name"
                                                placeholder="Middle name"
                                            />
                                            <InputError
                                                message={errors.middle_name}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="location">
                                                Location
                                            </Label>
                                            <Input
                                                id="location"
                                                name="location"
                                                placeholder="e.g. Manila Office"
                                            />
                                            <InputError
                                                message={errors.location}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                placeholder="+63..."
                                            />
                                            <InputError
                                                message={errors.phone}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="address">
                                                Address
                                            </Label>
                                            <Input
                                                id="address"
                                                name="address"
                                            />
                                            <InputError
                                                message={errors.address}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Government IDs</CardTitle>
                                    <CardDescription>
                                        SSS, PhilHealth, Pag-IBIG, and TIN
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="sss_number">
                                                SSS Number
                                            </Label>
                                            <Input
                                                id="sss_number"
                                                name="sss_number"
                                            />
                                            <InputError
                                                message={errors.sss_number}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="philhealth_number">
                                                PhilHealth Number
                                            </Label>
                                            <Input
                                                id="philhealth_number"
                                                name="philhealth_number"
                                            />
                                            <InputError
                                                message={
                                                    errors.philhealth_number
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="pagibig_number">
                                                Pag-IBIG Number
                                            </Label>
                                            <Input
                                                id="pagibig_number"
                                                name="pagibig_number"
                                            />
                                            <InputError
                                                message={errors.pagibig_number}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="tin_number">
                                                TIN
                                            </Label>
                                            <Input
                                                id="tin_number"
                                                name="tin_number"
                                            />
                                            <InputError
                                                message={errors.tin_number}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Employment Details</CardTitle>
                                    <CardDescription>
                                        Position, rate, and hiring information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="position">
                                                Position
                                            </Label>
                                            <Select
                                                name="position"
                                                defaultValue="regular"
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select position" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="regular">
                                                        Regular
                                                    </SelectItem>
                                                    <SelectItem value="contractual">
                                                        Contractual
                                                    </SelectItem>
                                                    <SelectItem value="project_based">
                                                        Project Based
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={errors.position}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="role_id">
                                                Role
                                            </Label>
                                            <Select name="role_id">
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Default role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem
                                                            key={role.id}
                                                            value={String(
                                                                role.id,
                                                            )}
                                                        >
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={errors.role_id}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="hire_date">
                                                Hire Date
                                            </Label>
                                            <Input
                                                id="hire_date"
                                                name="hire_date"
                                                type="date"
                                                required
                                            />
                                            <InputError
                                                message={errors.hire_date}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="current_daily_rate">
                                                Daily Rate
                                            </Label>
                                            <Input
                                                id="current_daily_rate"
                                                name="current_daily_rate"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                required
                                                placeholder="0.00"
                                            />
                                            <InputError
                                                message={
                                                    errors.current_daily_rate
                                                }
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Account</CardTitle>
                                    <CardDescription>
                                        Login credentials
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                placeholder="employee@example.com"
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">
                                                Password
                                            </Label>
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                required
                                                placeholder="Password"
                                            />
                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Work Schedule</CardTitle>
                                    <CardDescription>
                                        Default shift and rest days (optional)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="schedule_start">
                                                    Shift Start
                                                </Label>
                                                <Input
                                                    id="schedule_start"
                                                    name="schedule_start"
                                                    type="time"
                                                    defaultValue="08:00"
                                                />
                                                <InputError
                                                    message={
                                                        errors.schedule_start
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="schedule_end">
                                                    Shift End
                                                </Label>
                                                <Input
                                                    id="schedule_end"
                                                    name="schedule_end"
                                                    type="time"
                                                    defaultValue="17:00"
                                                />
                                                <InputError
                                                    message={
                                                        errors.schedule_end
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <fieldset className="grid gap-2">
                                            <legend className="text-sm font-medium">
                                                Rest Days
                                            </legend>
                                            <div className="flex flex-wrap gap-3">
                                                {[
                                                    'sunday',
                                                    'monday',
                                                    'tuesday',
                                                    'wednesday',
                                                    'thursday',
                                                    'friday',
                                                    'saturday',
                                                ].map((day) => (
                                                    <label
                                                        key={day}
                                                        className="flex items-center gap-1.5 text-sm"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            name="rest_days[]"
                                                            value={day}
                                                            defaultChecked={
                                                                day === 'sunday'
                                                            }
                                                            className="rounded border-gray-300"
                                                        />
                                                        {day
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            day.slice(1)}
                                                    </label>
                                                ))}
                                            </div>
                                            <InputError
                                                message={errors.rest_days}
                                            />
                                        </fieldset>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex items-center gap-4">
                                <Button type="submit" disabled={processing}>
                                    Create Employee
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

EmployeeCreate.layout = {
    breadcrumbs: [
        { title: 'Payroll', href: '/payroll' },
        { title: 'Employees', href: employeesIndex() },
        { title: 'Add Employee', href: store.url() },
    ],
};
