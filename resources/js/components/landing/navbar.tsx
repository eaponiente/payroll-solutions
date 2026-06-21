import { Link, usePage } from '@inertiajs/react';
import { Menu, X, Calendar } from 'lucide-react';
import { useState } from 'react';
import { login, dashboard } from '@/routes';

const BOOK_DEMO_URL = 'https://calendly.com/demo';

const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Testimonials', href: '#testimonials' },
];

export default function LandingNavbar() {
    const { auth } = usePage().props;
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0B0B2B]/90 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-white">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-sm font-bold text-white">
                        P
                    </span>
                    Payvolve
                </Link>

                <div className="hidden items-center gap-8 md:flex">
                    {navLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-sm text-indigo-200 transition-colors hover:text-white"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className="hidden items-center gap-3 md:flex">
                    <a
                        href={BOOK_DEMO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-400"
                    >
                        <Calendar className="h-4 w-4" />
                        Book a Demo
                    </a>
                    {auth.user ? (
                        <Link
                            href={dashboard()}
                            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white transition-colors hover:border-white/40 hover:bg-white/5"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <Link
                            href={login()}
                            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white transition-colors hover:border-white/40 hover:bg-white/5"
                        >
                            Sign In
                        </Link>
                    )}
                </div>

                <button
                    className="inline-flex items-center justify-center rounded-md p-2 text-white md:hidden"
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {mobileOpen && (
                <div className="border-t border-white/10 bg-[#0B0B2B] px-4 pb-4 md:hidden">
                    <div className="flex flex-col gap-3 pt-4">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="rounded-md px-3 py-2 text-sm text-indigo-200 transition-colors hover:bg-white/5 hover:text-white"
                                onClick={() => setMobileOpen(false)}
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="mt-2 flex flex-col gap-2 border-t border-white/10 pt-3">
                            <a
                                href={BOOK_DEMO_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-400"
                            >
                                <Calendar className="h-4 w-4" />
                                Book a Demo
                            </a>
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="rounded-lg border border-white/20 px-4 py-2.5 text-center text-sm text-white transition-colors hover:bg-white/5"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={login()}
                                    className="rounded-lg border border-white/20 px-4 py-2.5 text-center text-sm text-white transition-colors hover:bg-white/5"
                                >
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
