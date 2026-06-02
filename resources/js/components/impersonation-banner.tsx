import { usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export function ImpersonationBanner() {
    const { props } = usePage();
    const { auth, activeAccount } = props;

    if (
        !auth.user?.is_super_admin ||
        !activeAccount ||
        !auth.user.employee
    ) {
        return null;
    }

    const isImpersonating =
        activeAccount.id !== auth.user.employee?.account_id;

    if (!isImpersonating) {
        return null;
    }

    const handleSwitchBack = () => {
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        fetch(`/admin/switch-account/${auth.user.employee?.account_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken ?? '',
                Accept: 'application/json',
            },
        }).then(() => {
            window.location.href = window.location.origin + '/dashboard';
        });
    };

    return (
        <div className="flex items-center justify-center gap-2 bg-amber-600 px-4 py-2 text-sm text-white">
            <span>
                Viewing as: <strong>{activeAccount.name}</strong>
            </span>
            <button
                type="button"
                onClick={handleSwitchBack}
                className="ml-4 inline-flex cursor-pointer items-center gap-1 underline underline-offset-2"
            >
                <ArrowLeft className="size-3.5" />
                Back to my account
            </button>
        </div>
    );
}
