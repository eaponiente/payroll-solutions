import { Link } from '@inertiajs/react';
import { ArrowRight, Calendar, Play } from 'lucide-react';
import { register } from '@/routes';

const BOOK_DEMO_URL = 'https://calendly.com/demo';

const stats = [
    { value: '10,000+', label: 'Businesses Served' },
    { value: '2M+', label: 'Payrolls Processed' },
    { value: '99.9%', label: 'Tax Filing Accuracy' },
    { value: '24/7', label: 'Expert Support' },
];

export default function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-[#0B0B2B] via-[#151347] to-[#0B0B2B]">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-teal-500/5 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-amber-500/5 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-32 sm:px-6 sm:pb-20 sm:pt-40 lg:px-8 lg:pb-28 lg:pt-44">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5">
                        <Play className="h-3.5 w-3.5 text-teal-400" fill="currentColor" />
                        <span className="text-sm font-medium text-teal-300">
                            See Payvolve in action
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Payroll,{' '}
                        <span className="bg-gradient-to-r from-teal-400 to-amber-400 bg-clip-text text-transparent">
                            simplified
                        </span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-indigo-200 sm:text-xl">
                        Run payroll in minutes, not hours. Automated tax filings, seamless time tracking,
                        and compliance built right in. Everything you need to pay your team — effortlessly.
                    </p>
                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
                            href={register()}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-8 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10"
                        >
                            Get Started Free
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>
                </div>

                <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm sm:grid-cols-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="px-6 py-8 text-center">
                            <div className="text-2xl font-bold text-white sm:text-3xl">
                                {stat.value}
                            </div>
                            <div className="mt-1 text-sm text-indigo-300">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-[#0a0a0a]" />
        </section>
    );
}
