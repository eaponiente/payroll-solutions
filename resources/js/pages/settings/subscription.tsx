import { Head } from '@inertiajs/react';
import { CheckIcon, MinusIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type Plan = {
    key: string;
    name: string;
    price: string;
    employees: string;
    popular: boolean;
    current: boolean;
    features: { name: string; included: boolean }[];
};

const plans: Plan[] = [
    {
        key: 'starter',
        name: 'Starter',
        price: '₱999',
        employees: 'Up to 10 employees',
        popular: false,
        current: true,
        features: [
            { name: 'Punch in / out tracking', included: true },
            { name: 'Attendance sheets', included: true },
            { name: 'Employee management', included: true },
            { name: 'Manual pay processing', included: true },
            { name: 'Fixed schedules', included: true },
            { name: 'Overtime requests', included: false },
            { name: 'Leave management', included: false },
            { name: 'Cash advances', included: false },
            { name: 'Fines management', included: false },
            { name: 'Correction requests', included: false },
            { name: 'Payroll processing', included: false },
            { name: 'SSS / PhilHealth / Pag-IBIG', included: false },
            { name: 'Audit logs', included: false },
            { name: 'De minimis benefits', included: false },
            { name: 'Shifting schedules', included: false },
        ],
    },
    {
        key: 'professional',
        name: 'Professional',
        price: '₱2,999',
        employees: 'Up to 50 employees',
        popular: true,
        current: false,
        features: [
            { name: 'Punch in / out tracking', included: true },
            { name: 'Attendance sheets', included: true },
            { name: 'Employee management', included: true },
            { name: 'Manual pay processing', included: true },
            { name: 'Fixed schedules', included: true },
            { name: 'Overtime requests', included: true },
            { name: 'Leave management', included: true },
            { name: 'Cash advances', included: true },
            { name: 'Fines management', included: true },
            { name: 'Correction requests', included: true },
            { name: 'Payroll processing', included: true },
            { name: 'SSS / PhilHealth / Pag-IBIG', included: true },
            { name: 'Audit logs', included: true },
            { name: 'De minimis benefits', included: false },
            { name: 'Shifting schedules', included: false },
        ],
    },
    {
        key: 'enterprise',
        name: 'Enterprise',
        price: '₱5,999',
        employees: 'Unlimited employees',
        popular: false,
        current: false,
        features: [
            { name: 'Punch in / out tracking', included: true },
            { name: 'Attendance sheets', included: true },
            { name: 'Employee management', included: true },
            { name: 'Manual pay processing', included: true },
            { name: 'Fixed schedules', included: true },
            { name: 'Overtime requests', included: true },
            { name: 'Leave management', included: true },
            { name: 'Cash advances', included: true },
            { name: 'Fines management', included: true },
            { name: 'Correction requests', included: true },
            { name: 'Payroll processing', included: true },
            { name: 'SSS / PhilHealth / Pag-IBIG', included: true },
            { name: 'Audit logs', included: true },
            { name: 'De minimis benefits', included: true },
            { name: 'Shifting schedules', included: true },
        ],
    },
];

export default function Subscription() {
    return (
        <>
            <Head title="Subscription plans" />

            <div className="space-y-6">
                <div className="py-6 text-center">
                    <h2 className="text-2xl font-semibold tracking-tight">
                        Choose your plan
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Simple, transparent pricing that grows with your team
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {plans.map((plan) => (
                        <Card
                            key={plan.key}
                            className={cn(
                                'relative flex flex-col transition-shadow',
                                plan.popular &&
                                    'z-10 shadow-lg ring-2 ring-primary md:scale-[1.02]',
                                plan.current &&
                                    !plan.popular &&
                                    'border-primary/30 bg-primary/[0.02]',
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute inset-x-0 -top-3 mx-auto w-fit">
                                    <Badge className="px-3 py-1 text-xs font-semibold">
                                        Most Popular
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="pb-4 text-center">
                                <CardTitle className="text-lg">
                                    {plan.name}
                                </CardTitle>
                                <div className="mt-3">
                                    <span className="text-4xl font-bold tracking-tight">
                                        {plan.price}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        /month
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {plan.employees}
                                </p>
                            </CardHeader>

                            <Separator />

                            <CardContent className="flex-1 pt-5">
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature.name}
                                            className="flex items-start gap-2.5 text-sm"
                                        >
                                            {feature.included ? (
                                                <CheckIcon className="mt-0.5 size-4 shrink-0 text-green-600" />
                                            ) : (
                                                <MinusIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground/30" />
                                            )}
                                            <span
                                                className={cn({
                                                    'text-muted-foreground line-through':
                                                        !feature.included,
                                                })}
                                            >
                                                {feature.name}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter className="pt-2">
                                <Button
                                    className="w-full"
                                    variant={
                                        plan.popular ? 'default' : 'outline'
                                    }
                                    disabled={plan.current}
                                >
                                    {plan.current
                                        ? 'Current Plan'
                                        : plan.popular
                                          ? 'Upgrade to Professional'
                                          : `Select ${plan.name}`}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}

Subscription.layout = {
    breadcrumbs: [
        {
            title: 'Subscription',
            href: '/settings/subscription',
        },
    ],
};
