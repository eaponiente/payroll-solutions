import { usePage } from '@inertiajs/react';
import {
    Ban,
    CalendarDays,
    CalendarHeart,
    CalendarRange,
    ClipboardCheck,
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
    Wrench,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
} from '@/components/ui/sidebar';
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

export function AppSidebar({ className }: { className?: string }) {
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

    const payrollChildren: NavItem[] = [];

    if (has('employees.view')) {
        payrollChildren.push({
            title: 'Employees',
            href: employeesIndex(),
            icon: Users,
        });
    }

    if (has('payroll.view')) {
        payrollChildren.push({
            title: 'Periods',
            href: periodsIndex(),
            icon: CalendarRange,
        });
    }

    const payrollNavItems: NavItem[] =
        payrollChildren.length > 0
            ? [
                  {
                      title: 'Payroll',
                      href: payrollIndex(),
                      icon: LayoutGrid,
                      items: [
                          {
                              title: 'Dashboard',
                              href: payrollIndex(),
                              icon: LayoutGrid,
                          },
                          ...payrollChildren,
                      ],
                  },
              ]
            : [
                  {
                      title: 'Payroll',
                      href: payrollIndex(),
                      icon: LayoutGrid,
                  },
              ];

    const attendanceChildren: NavItem[] = [];

    if (has('attendance.view_branch')) {
        attendanceChildren.push({
            title: 'Sheets',
            href: sheetsIndex(),
            icon: ClipboardCheck,
        });
    }

    if (has('overtime.submit') || has('overtime.approve')) {
        attendanceChildren.push({
            title: 'Overtime',
            href: overtimeIndex(),
            icon: Timer,
        });
    }

    if (has('leaves.submit') || has('leaves.approve')) {
        attendanceChildren.push({
            title: 'Leaves',
            href: leaveIndex(),
            icon: Umbrella,
        });
    }

    if (has('corrections.submit') || has('corrections.approve')) {
        attendanceChildren.push({
            title: 'Corrections',
            href: correctionsIndex(),
            icon: Pencil,
        });
    }

    if (has('cash_advances.submit') || has('cash_advances.approve')) {
        attendanceChildren.push({
            title: 'Cash Advances',
            href: cashAdvancesIndex(),
            icon: HandCoins,
        });
    }

    if (has('fines.view')) {
        attendanceChildren.push({
            title: 'Fines',
            href: finesIndex(),
            icon: Ban,
        });
    }

    const attendanceNavItems: NavItem[] =
        attendanceChildren.length > 0
            ? [
                  {
                      title: 'Attendance',
                      href: attendanceChildren[0].href,
                      icon: ClipboardCheck,
                      items: attendanceChildren,
                  },
              ]
            : [];

    const adminChildren: NavItem[] = [];

    if (has('admin.manage_shifts') && scheduleType === 'shifting') {
        adminChildren.push({
            title: 'Shifts',
            href: shiftsIndex(),
            icon: CalendarDays,
        });
    }

    if (has('admin.manage_roles')) {
        adminChildren.push({
            title: 'Roles',
            href: rolesIndex(),
            icon: Users,
        });
    }

    if (has('admin.manage_roles')) {
        adminChildren.push({
            title: 'Audit Logs',
            href: auditLogsIndex(),
            icon: FileClock,
        });
    }

    const adminNavItems: NavItem[] =
        adminChildren.length > 0
            ? [
                  {
                      title: 'Admin',
                      href: adminChildren[0].href,
                      icon: Settings,
                      items: adminChildren,
                  },
              ]
            : [];

    const configChildren: NavItem[] = [];

    if (has('admin.manage_holidays')) {
        configChildren.push({
            title: 'Holidays',
            href: holidaysIndex(),
            icon: CalendarHeart,
        });
    }

    if (has('admin.manage_config')) {
        configChildren.push({
            title: 'Config',
            href: configIndex(),
            icon: Settings,
        });
    }

    if (has('admin.manage_sss')) {
        configChildren.push({
            title: 'SSS Brackets',
            href: sssBracketsIndex(),
            icon: Table,
        });
    }

    if (has('admin.manage_config')) {
        configChildren.push({
            title: 'De Minimis',
            href: deminimisIndex(),
            icon: Gift,
        });
    }

    const configNavItems: NavItem[] =
        configChildren.length > 0
            ? [
                  {
                      title: 'Configuration',
                      href: configChildren[0].href,
                      icon: Wrench,
                      items: configChildren,
                  },
              ]
            : [];

    const footerNavItems: NavItem[] = [];

    return (
        <Sidebar collapsible="icon" variant="sidebar" className={className}>
            <SidebarContent className="pt-3">
                <NavMain items={payrollNavItems} />
                {attendanceNavItems.length > 0 && (
                    <NavMain items={attendanceNavItems} />
                )}
                {adminNavItems.length > 0 && <NavMain items={adminNavItems} />}
                {configNavItems.length > 0 && (
                    <NavMain items={configNavItems} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
            </SidebarFooter>
        </Sidebar>
    );
}
