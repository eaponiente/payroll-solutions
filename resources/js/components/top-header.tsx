import { usePage } from '@inertiajs/react';
import { Bell, Moon, Sun } from 'lucide-react';
import { AccountSwitcher } from '@/components/account-switcher';
import AppLogo from '@/components/app-logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useAppearance } from '@/hooks/use-appearance';
import { useInitials } from '@/hooks/use-initials';

export function TopHeader() {
    const { auth } = usePage<{
        auth: { user: { name: string; avatar?: string } };
    }>().props;
    const getInitials = useInitials();
    const { appearance, updateAppearance } = useAppearance();

    return (
        <header className="fixed top-0 right-0 left-0 z-50 flex h-[var(--header-height)] items-center gap-3 border-b border-sidebar-border bg-sidebar px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 text-sidebar-foreground/70 hover:text-sidebar-foreground" />
                <div className="flex items-center gap-2">
                    <AppLogo />
                </div>
                <AccountSwitcher />
            </div>

            <div className="ml-auto flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    aria-label="Notifications"
                >
                    <Bell className="size-5" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    onClick={() =>
                        updateAppearance(
                            appearance === 'dark' ? 'light' : 'dark',
                        )
                    }
                    aria-label="Toggle theme"
                >
                    {appearance === 'dark' ? (
                        <Sun className="size-5" />
                    ) : (
                        <Moon className="size-5" />
                    )}
                </Button>

                {auth.user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="ml-2 size-9 rounded-full p-0"
                            >
                                <Avatar className="size-8">
                                    <AvatarFallback className="bg-sidebar-primary-foreground/15 text-xs font-medium text-sidebar-foreground">
                                        {getInitials(auth.user.name ?? '')}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
