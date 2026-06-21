import { Link } from '@inertiajs/react';
import { ArrowRight, Calendar } from 'lucide-react';
import { login } from '@/routes';

const BOOK_DEMO_URL = 'https://calendly.com/demo';

const footerLinks = [
    {
        title: 'Product',
        links: [
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Pricing', href: '#' },
            { label: 'Integrations', href: '#' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About', href: '#' },
            { label: 'Careers', href: '#' },
            { label: 'Blog', href: '#' },
            { label: 'Contact', href: '#' },
        ],
    },
    {
        title: 'Resources',
        links: [
            { label: 'Help Center', href: '#' },
            { label: 'API Docs', href: '#' },
            { label: 'Status', href: '#' },
            { label: 'Security', href: '#' },
        ],
    },
];

export default function FooterCtaSection() {
    return (
        <>
            <section className="bg-[#0B0B2B] py-20 sm:py-28">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 to-amber-500/5 p-10 text-center sm:p-16">
                        <h2 className="text-3xl font-bold text-white sm:text-4xl">
                            Ready to simplify your payroll?
                        </h2>
                        <p className="mx-auto mt-4 max-w-lg text-lg text-indigo-200">
                            Join thousands of businesses that run payroll in minutes, not days. Book a
                            demo and see how easy it can be.
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <a
                                href={BOOK_DEMO_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-8 py-3.5 text-base font-medium text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-400 hover:shadow-teal-500/40"
                            >
                                <Calendar className="h-5 w-5" />
                                Book a Demo
                            </a>
                            <Link
                                href={login()}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-8 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10"
                            >
                                Sign In
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/10 bg-[#0B0B2B]">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-lg font-semibold text-white"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-sm font-bold text-white">
                                    P
                                </span>
                                Payvolve
                            </Link>
                            <p className="mt-3 text-sm text-indigo-300">
                                Payroll, simplified. Run payroll in minutes with automated tax filing
                                and compliance built in.
                            </p>
                        </div>
                        {footerLinks.map((group) => (
                            <div key={group.title}>
                                <h4 className="text-sm font-semibold text-white">{group.title}</h4>
                                <ul className="mt-4 space-y-3">
                                    {group.links.map((link) => (
                                        <li key={link.label}>
                                            <a
                                                href={link.href}
                                                className="text-sm text-indigo-300 transition-colors hover:text-white"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-indigo-400">
                        &copy; {new Date().getFullYear()} Payvolve. All rights reserved.
                    </div>
                </div>
            </footer>
        </>
    );
}
