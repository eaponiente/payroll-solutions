import { Link } from '@inertiajs/react';
import { CreditCard, ShieldCheck, User } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: User,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: ShieldCheck,
    },
    {
        title: 'Subscription',
        href: '/settings/subscription',
        icon: CreditCard,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <div className="px-4 py-6">
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
                <aside className="w-full shrink-0 lg:w-56">
                    <div className="sticky top-[calc(var(--header-height)+1.5rem)]">
                        <p className="mb-1 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Account
                        </p>
                        <nav
                            className="flex flex-col gap-1"
                            aria-label="Account settings"
                        >
                            {sidebarNavItems.slice(0, 2).map((item) => (
                                <SettingsNavItem key={item.title} item={item} />
                            ))}
                        </nav>

                        <p className="mt-6 mb-1 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Billing
                        </p>
                        <nav
                            className="flex flex-col gap-1"
                            aria-label="Billing settings"
                        >
                            {sidebarNavItems.slice(2).map((item) => (
                                <SettingsNavItem key={item.title} item={item} />
                            ))}
                        </nav>
                    </div>
                </aside>

                <div className="flex-1 space-y-6">{children}</div>
            </div>
        </div>
    );
}

function SettingsNavItem({ item }: { item: NavItem }) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const isActive = isCurrentOrParentUrl(item.href);

    return (
        <Link
            href={item.href}
            className={cn(
                'flex items-center gap-3 rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-colors',
                isActive
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
        >
            {item.icon && <item.icon className="size-4" />}
            <span>{item.title}</span>
        </Link>
    );
}
