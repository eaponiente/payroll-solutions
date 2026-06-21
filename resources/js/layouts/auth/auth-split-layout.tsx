import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="grid min-h-screen lg:grid-cols-2">
            <div className="relative hidden flex-col overflow-hidden lg:flex">
                <div className="absolute inset-0 bg-[var(--sidebar)]" />

                <svg
                    className="absolute top-0 right-0 h-full opacity-[0.06]"
                    viewBox="0 0 400 800"
                    fill="none"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <circle cx="200" cy="200" r="180" fill="white" />
                    <circle cx="350" cy="450" r="120" fill="white" />
                    <circle cx="100" cy="650" r="150" fill="white" />
                </svg>

                <svg
                    className="absolute bottom-0 left-0 opacity-[0.04]"
                    viewBox="0 0 400 400"
                    fill="none"
                >
                    <path
                        d="M0 400 C 100 250, 200 350, 400 200 L 400 400 Z"
                        fill="white"
                    />
                </svg>

                <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-12">
                    <div className="flex flex-col items-center gap-6">
                        <Link href={home()}>
                            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                                <AppLogoIcon className="size-9 fill-current text-white" />
                            </div>
                        </Link>

                        <h1 className="text-3xl font-semibold tracking-tight text-white">
                            {name}
                        </h1>

                        <p className="max-w-sm text-center text-sm leading-relaxed text-white/60">
                            Streamlined payroll and attendance management for
                            modern teams. Automate calculations, track time, and
                            stay compliant.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 border-t border-white/10 px-12 py-6">
                    <p className="text-center text-xs text-white/40">
                        &copy; {new Date().getFullYear()} {name}. All rights
                        reserved.
                    </p>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center bg-background px-6 py-12 lg:px-8">
                <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[400px]">
                    <Link
                        href={home()}
                        className="flex items-center justify-center gap-3 lg:hidden"
                    >
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                            <AppLogoIcon className="size-6 fill-current text-primary" />
                        </div>
                        <span className="text-lg font-semibold">{name}</span>
                    </Link>

                    <div className="flex flex-col gap-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
