import { Head } from '@inertiajs/react';
import { Form } from '@inertiajs/react';
import { useState } from 'react';
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
import { update, index as employeesIndex } from '@/routes/employees';

type Role = {
    id: number;
    name: string;
    slug: string;
};

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
    middle_name: string | null;
    location: string | null;
    phone: string | null;
    address: string | null;
    sss_number: string | null;
    philhealth_number: string | null;
    pagibig_number: string | null;
    tin_number: string | null;
    position: string;
    hire_date: string;
    current_daily_rate: number;
    role_id: number | null;
    paid_leaves_allowed: number;
    user: { id: number; email: string } | null;
};

type Props = {
    employee: Employee;
    roles: Role[];
};

export default function EmployeeEdit({ employee, roles }: Props) {
    const toDateValue = (val: string | null) => {
        if (!val) {
            return '';
        }

        return val.slice(0, 10);
    };

    const [formData, setFormData] = useState({
        first_name: employee.first_name,
        last_name: employee.last_name,
        middle_name: employee.middle_name ?? '',
        location: employee.location ?? '',
        phone: employee.phone ?? '',
        address: employee.address ?? '',
        position: employee.position,
        hire_date: toDateValue(employee.hire_date),
        current_daily_rate: String(employee.current_daily_rate),
        sss_number: employee.sss_number ?? '',
        philhealth_number: employee.philhealth_number ?? '',
        pagibig_number: employee.pagibig_number ?? '',
        tin_number: employee.tin_number ?? '',
        role_id: employee.role_id ? String(employee.role_id) : '',
        paid_leaves_allowed: String(employee.paid_leaves_allowed ?? 5),
        email: employee.user?.email ?? '',
        password: '',
    });

    const updateField = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <>
            <Head title={`Edit ${employee.first_name} ${employee.last_name}`} />

            <div className="space-y-6">
                <Heading
                    title={`Edit ${employee.first_name} ${employee.last_name}`}
                    description="Update employee information"
                />

                <Form
                    {...update.form({ employee: employee.id })}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>
                                        Name and contact details
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
                                                value={formData.first_name}
                                                onChange={(e) =>
                                                    updateField(
                                                        'first_name',
                                                        e.target.value,
                                                    )
                                                }
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
                                                value={formData.last_name}
                                                onChange={(e) =>
                                                    updateField(
                                                        'last_name',
                                                        e.target.value,
                                                    )
                                                }
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
                                                value={formData.middle_name}
                                                onChange={(e) =>
                                                    updateField(
                                                        'middle_name',
                                                        e.target.value,
                                                    )
                                                }
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
                                                value={formData.location}
                                                onChange={(e) =>
                                                    updateField(
                                                        'location',
                                                        e.target.value,
                                                    )
                                                }
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
                                                value={formData.phone}
                                                onChange={(e) =>
                                                    updateField(
                                                        'phone',
                                                        e.target.value,
                                                    )
                                                }
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
                                                value={formData.address}
                                                onChange={(e) =>
                                                    updateField(
                                                        'address',
                                                        e.target.value,
                                                    )
                                                }
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
                                                value={formData.position}
                                                onValueChange={(v) =>
                                                    updateField('position', v)
                                                }
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
                                            <Label htmlFor="hire_date">
                                                Hire Date
                                            </Label>
                                            <Input
                                                id="hire_date"
                                                name="hire_date"
                                                type="date"
                                                value={formData.hire_date}
                                                onChange={(e) =>
                                                    updateField(
                                                        'hire_date',
                                                        e.target.value,
                                                    )
                                                }
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
                                                value={
                                                    formData.current_daily_rate
                                                }
                                                onChange={(e) =>
                                                    updateField(
                                                        'current_daily_rate',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.current_daily_rate
                                                }
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="paid_leaves_allowed">
                                                Paid Leaves / Year
                                            </Label>
                                            <Input
                                                id="paid_leaves_allowed"
                                                name="paid_leaves_allowed"
                                                type="number"
                                                min="0"
                                                max="365"
                                                value={
                                                    formData.paid_leaves_allowed
                                                }
                                                onChange={(e) =>
                                                    updateField(
                                                        'paid_leaves_allowed',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.paid_leaves_allowed
                                                }
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
                                                value={formData.sss_number}
                                                onChange={(e) =>
                                                    updateField(
                                                        'sss_number',
                                                        e.target.value,
                                                    )
                                                }
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
                                                value={
                                                    formData.philhealth_number
                                                }
                                                onChange={(e) =>
                                                    updateField(
                                                        'philhealth_number',
                                                        e.target.value,
                                                    )
                                                }
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
                                                value={formData.pagibig_number}
                                                onChange={(e) =>
                                                    updateField(
                                                        'pagibig_number',
                                                        e.target.value,
                                                    )
                                                }
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
                                                value={formData.tin_number}
                                                onChange={(e) =>
                                                    updateField(
                                                        'tin_number',
                                                        e.target.value,
                                                    )
                                                }
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
                                    <CardTitle>Role</CardTitle>
                                    <CardDescription>
                                        Assign a role with specific permissions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="role_id">
                                                Role
                                            </Label>
                                            <Select
                                                name="role_id"
                                                value={formData.role_id}
                                                onValueChange={(v) =>
                                                    updateField('role_id', v)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a role" />
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
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Account</CardTitle>
                                    <CardDescription>
                                        Login email and password
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
                                                value={formData.email}
                                                onChange={(e) =>
                                                    updateField(
                                                        'email',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">
                                                New Password
                                            </Label>
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) =>
                                                    updateField(
                                                        'password',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Leave blank to keep current"
                                            />
                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex items-center gap-4">
                                <Button type="submit" disabled={processing}>
                                    Save Changes
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

EmployeeEdit.layout = {
    breadcrumbs: [
        { title: 'Payroll', href: '/payroll' },
        { title: 'Employees', href: employeesIndex() },
        { title: 'Edit Employee', href: '#' },
    ],
};
