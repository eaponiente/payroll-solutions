import { usePage } from '@inertiajs/react';
import { AppContent } from '@/components/app-content';
import { AppSidebar } from '@/components/app-sidebar';
import { ImpersonationBanner } from '@/components/impersonation-banner';
import { TopHeader } from '@/components/top-header';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const isOpen = usePage().props.sidebarOpen;

    return (
        <SidebarProvider defaultOpen={isOpen}>
            <TopHeader breadcrumbs={breadcrumbs} />
            <div className="flex flex-1">
                <AppSidebar className="top-[var(--header-height)] h-[calc(100svh-var(--header-height))]" />
                <AppContent
                    variant="sidebar"
                    className="pt-[var(--header-height)]"
                >
                    <ImpersonationBanner />
                    <div className="p-4 md:p-6">{children}</div>
                </AppContent>
            </div>
        </SidebarProvider>
    );
}
