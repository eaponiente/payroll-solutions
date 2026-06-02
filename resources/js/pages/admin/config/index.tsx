import { Form, Head } from '@inertiajs/react';
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
import { index, update } from '@/routes/config';

type PageProps = {
    configs: Record<string, string | null>;
    timezone: string;
    scheduleType: string;
};

export default function ConfigIndex({
    configs,
    timezone,
    scheduleType,
}: PageProps) {
    return (
        <>
            <Head title="Company Configuration" />

            <Heading
                title="Company Configuration"
                description="Manage company-wide payroll settings"
            />

            <Card>
                <CardHeader>
                    <CardTitle>Deduction Settings</CardTitle>
                    <CardDescription>
                        Configure contribution rates and deduction amounts.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...update.form()} className="space-y-6">
                        {({
                            processing,
                            errors,
                        }: {
                            processing: boolean;
                            errors: Record<string, string>;
                        }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="philhealth_premium_percent">
                                        PhilHealth Premium Percent
                                    </Label>
                                    <Input
                                        id="philhealth_premium_percent"
                                        type="number"
                                        name="philhealth_premium_percent"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        defaultValue={
                                            configs.philhealth_premium_percent ??
                                            undefined
                                        }
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Percentage of salary contributed to
                                        PhilHealth (0-100%).
                                    </p>
                                    <InputError
                                        message={
                                            errors.philhealth_premium_percent
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="pagibig_monthly_share">
                                        Pag-IBIG Monthly Share (₱)
                                    </Label>
                                    <Input
                                        id="pagibig_monthly_share"
                                        type="number"
                                        name="pagibig_monthly_share"
                                        min="0"
                                        step="0.01"
                                        defaultValue={
                                            configs.pagibig_monthly_share ??
                                            undefined
                                        }
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Fixed monthly Pag-IBIG contribution
                                        amount per employee.
                                    </p>
                                    <InputError
                                        message={errors.pagibig_monthly_share}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>
                                        Save Configuration
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Timezone</CardTitle>
                    <CardDescription>
                        Set the timezone for date and time display
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...update.form()} className="space-y-6">
                        {({
                            processing,
                            errors,
                        }: {
                            processing: boolean;
                            errors: Record<string, string>;
                        }) => (
                            <>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="timezone">
                                            Timezone
                                        </Label>
                                        <Select
                                            name="timezone"
                                            defaultValue={timezone}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Asia/Manila">
                                                    Asia/Manila (UTC+8)
                                                </SelectItem>
                                                <SelectItem value="Asia/Singapore">
                                                    Asia/Singapore (UTC+8)
                                                </SelectItem>
                                                <SelectItem value="Asia/Tokyo">
                                                    Asia/Tokyo (UTC+9)
                                                </SelectItem>
                                                <SelectItem value="Asia/Dubai">
                                                    Asia/Dubai (UTC+4)
                                                </SelectItem>
                                                <SelectItem value="Europe/London">
                                                    Europe/London (UTC+0)
                                                </SelectItem>
                                                <SelectItem value="America/New_York">
                                                    America/New York (UTC-5)
                                                </SelectItem>
                                                <SelectItem value="America/Chicago">
                                                    America/Chicago (UTC-6)
                                                </SelectItem>
                                                <SelectItem value="America/Los_Angeles">
                                                    America/Los Angeles (UTC-8)
                                                </SelectItem>
                                                <SelectItem value="Pacific/Auckland">
                                                    Pacific/Auckland (UTC+12)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.timezone} />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>
                                        Save Configuration
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Schedule Mode</CardTitle>
                    <CardDescription>
                        Fixed schedules (8am-5pm) or flexible shifting schedules
                        for F&amp;B and retail
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...update.form()} className="space-y-6">
                        {({
                            processing,
                            errors,
                        }: {
                            processing: boolean;
                            errors: Record<string, string>;
                        }) => (
                            <>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="schedule_type">
                                            Schedule Mode
                                        </Label>
                                        <Select
                                            name="schedule_type"
                                            defaultValue={scheduleType}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fixed">
                                                    Fixed Schedule (Default)
                                                </SelectItem>
                                                <SelectItem value="shifting">
                                                    Flexible Shifts
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Fixed: employees work the same hours
                                            daily. Shifting: assign rotating
                                            shifts via the roster.
                                        </p>
                                        <InputError
                                            message={errors.schedule_type}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button disabled={processing}>
                                        Save Configuration
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>
        </>
    );
}

ConfigIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin',
        },
        {
            title: 'Configuration',
            href: index(),
        },
    ],
};
