import { usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AccountSwitcher() {
    const { props } = usePage();
    const { accounts, activeAccount, auth } = props;

    if (!auth.user?.is_super_admin || !accounts?.length) {
        return null;
    }

    const handleSwitch = (accountId: number) => {
        if (accountId === activeAccount?.id) {
            return;
        }

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        fetch(`/admin/switch-account/${accountId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken ?? '',
                Accept: 'application/json',
            },
        }).then((res) => {
            if (res.ok || res.redirected) {
                window.location.href = res.url || window.location.origin + '/dashboard';
            }
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center gap-1.5 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10"
                >
                    <span className="max-w-32 truncate text-sm font-medium">
                        {activeAccount?.name ?? auth.user?.name}
                    </span>
                    <ChevronsUpDown className="size-3.5 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
                {accounts.map((account) => (
                    <DropdownMenuItem
                        key={account.id}
                        className="flex cursor-pointer items-center justify-between"
                        onClick={() => handleSwitch(account.id)}
                    >
                        <span className="truncate">{account.name}</span>
                        {account.id === activeAccount?.id && (
                            <Check className="ml-2 size-4" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
