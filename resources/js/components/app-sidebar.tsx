import { Link, usePage } from '@inertiajs/react';
import {
    Ban,
    CalendarDays,
    CalendarHeart,
    CalendarRange,
    ClipboardCheck,
    Clock,
    FileClock,
    Gift,
    HandCoins,
    LayoutGrid,
    Pencil,
    Settings,
    Table,
    Timer,
    Umbrella,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { AccountSwitcher } from '@/components/account-switcher';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { my as myAttendance } from '@/routes/attendance';
import { index as sheetsIndex } from '@/routes/attendance/sheets';
import { index as auditLogsIndex } from '@/routes/audit-logs';
import { index as cashAdvancesIndex } from '@/routes/cash-advances';
import { index as configIndex } from '@/routes/config';
import { index as correctionsIndex } from '@/routes/corrections';
import { index as deminimisIndex } from '@/routes/deminimis';
import { index as employeesIndex } from '@/routes/employees';
import { index as finesIndex } from '@/routes/fines';
import { index as holidaysIndex } from '@/routes/holidays';
import { index as leaveIndex } from '@/routes/leave';
import { index as overtimeIndex } from '@/routes/overtime';
import { index as payrollIndex } from '@/routes/payroll';
import { index as periodsIndex } from '@/routes/payroll/periods';
import { index as rolesIndex } from '@/routes/roles';
import { index as shiftsIndex } from '@/routes/shifts';
import { index as sssBracketsIndex } from '@/routes/sss-brackets';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth, scheduleType: st } = usePage<{
        auth: {
            user: {
                role: string;
                employee: { id: number } | null;
                permissions: string[];
            };
        };
        scheduleType: string;
    }>().props;
    const permissions = auth.user?.permissions ?? [];
    const scheduleType = st ?? 'fixed';

    const has = (perm: string) => permissions.includes(perm);

    const myAttendanceNavItems: NavItem[] = [];

    if (has('attendance.view_own') || has('attendance.punch')) {
        myAttendanceNavItems.push({
            title: 'My Attendance',
            href: myAttendance(),
            icon: Clock,
        });
    }

    const payrollNavItems: NavItem[] = [
        {
            title: 'Payroll',
            href: payrollIndex(),
            icon: LayoutGrid,
        },
    ];

    if (has('employees.view')) {
        payrollNavItems.push({
            title: 'Employees',
            href: employeesIndex(),
            icon: Users,
        });
    }

    if (has('payroll.view')) {
        payrollNavItems.push({
            title: 'Periods',
            href: periodsIndex(),
            icon: CalendarRange,
        });
    }

    const attendanceNavItems: NavItem[] = [];

    if (has('attendance.view_branch')) {
        attendanceNavItems.push({
            title: 'Sheets',
            href: sheetsIndex(),
            icon: ClipboardCheck,
        });
    }

    if (has('overtime.submit') || has('overtime.approve')) {
        attendanceNavItems.push({
            title: 'Overtime',
            href: overtimeIndex(),
            icon: Timer,
        });
    }

    if (has('leaves.submit') || has('leaves.approve')) {
        attendanceNavItems.push({
            title: 'Leaves',
            href: leaveIndex(),
            icon: Umbrella,
        });
    }

    if (has('corrections.submit') || has('corrections.approve')) {
        attendanceNavItems.push({
            title: 'Corrections',
            href: correctionsIndex(),
            icon: Pencil,
        });
    }

    if (has('cash_advances.submit') || has('cash_advances.approve')) {
        attendanceNavItems.push({
            title: 'Cash Advances',
            href: cashAdvancesIndex(),
            icon: HandCoins,
        });
    }

    if (has('fines.view')) {
        attendanceNavItems.push({
            title: 'Fines',
            href: finesIndex(),
            icon: Ban,
        });
    }

    const adminNavItems: NavItem[] = [];

    if (has('admin.manage_shifts') && scheduleType === 'shifting') {
        adminNavItems.push({
            title: 'Shifts',
            href: shiftsIndex(),
            icon: CalendarDays,
        });
    }

    if (has('admin.manage_roles')) {
        adminNavItems.push({ title: 'Roles', href: rolesIndex(), icon: Users });
    }

    if (has('admin.manage_holidays')) {
        adminNavItems.push({
            title: 'Holidays',
            href: holidaysIndex(),
            icon: CalendarHeart,
        });
    }

    if (has('admin.manage_config')) {
        adminNavItems.push({
            title: 'Config',
            href: configIndex(),
            icon: Settings,
        });
    }

    if (has('admin.manage_sss')) {
        adminNavItems.push({
            title: 'SSS Brackets',
            href: sssBracketsIndex(),
            icon: Table,
        });
    }

    if (has('admin.manage_config')) {
        adminNavItems.push({
            title: 'De Minimis',
            href: deminimisIndex(),
            icon: Gift,
        });
    }

    if (has('admin.manage_roles')) {
        adminNavItems.push({
            title: 'Audit Logs',
            href: auditLogsIndex(),
            icon: FileClock,
        });
    }

    const footerNavItems: NavItem[] = [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <AccountSwitcher variant="sidebar" />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {myAttendanceNavItems.length > 0 && (
                    <NavMain items={myAttendanceNavItems} />
                )}
                <NavMain items={payrollNavItems} label="Payroll" />
                {attendanceNavItems.length > 0 && (
                    <NavMain items={attendanceNavItems} label="Attendance" />
                )}
                {adminNavItems.length > 0 && (
                    <NavMain items={adminNavItems} label="Account Settings" />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
