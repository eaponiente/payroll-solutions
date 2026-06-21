import { Clock, CheckCircle, CreditCard } from 'lucide-react';

const steps = [
    {
        step: '01',
        icon: Clock,
        title: 'Sync your team & hours',
        description:
            'Connect your team roster and time tracking. Hours, overtime, and schedules sync automatically — no spreadsheets needed.',
    },
    {
        step: '02',
        icon: CheckCircle,
        title: 'Review & confirm',
        description:
            'We surface everything in a clean summary. Review deductions, taxes, and net pay for each employee in one screen before you submit.',
    },
    {
        step: '03',
        icon: CreditCard,
        title: 'Pay your team',
        description:
            'One click and payroll runs. Direct deposit lands in employee accounts fast. Payslips and tax filings are handled automatically.',
    },
];

export default function HowItWorksSection() {
    return (
        <section id="how-it-works" className="bg-[#F5F6FA] py-20 dark:bg-[#0B0B2B]/40 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-[#1E1B4B] sm:text-4xl dark:text-white">
                        Run payroll in minutes
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                        Three simple steps. No math. No stress.
                    </p>
                </div>

                <div className="mt-16 grid gap-8 lg:grid-cols-3">
                    {steps.map((item) => (
                        <div key={item.step} className="relative">
                            <div className="rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:shadow-lg dark:border-gray-800 dark:bg-[#0B0B2B]/80">
                                <div className="mb-6 text-5xl font-bold text-teal-500/20">
                                    {item.step}
                                </div>
                                <div className="mb-4 inline-flex rounded-xl bg-teal-500/10 p-3">
                                    <item.icon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                                </div>
                                <h3 className="mb-3 text-lg font-semibold text-[#1E1B4B] dark:text-white">
                                    {item.title}
                                </h3>
                                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
