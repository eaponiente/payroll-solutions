import { Calculator, Shield, Clock, Users, FileText, BarChart3 } from 'lucide-react';

const features = [
    {
        icon: Calculator,
        title: 'Automated Tax Filing',
        description:
            'Federal, state, and local taxes calculated and filed automatically every pay period. Never miss a deadline again.',
    },
    {
        icon: Shield,
        title: 'Compliance Built In',
        description:
            'Stay compliant with changing labor laws, minimum wage updates, and reporting requirements across all jurisdictions.',
    },
    {
        icon: Clock,
        title: 'Time & Attendance',
        description:
            'Track hours, manage shifts, and handle overtime automatically. Synced directly to payroll — no manual entry.',
    },
    {
        icon: Users,
        title: 'Employee Self-Service',
        description:
            'Employees access paystubs, W-2s, update their info, and manage direct deposits from any device, anytime.',
    },
    {
        icon: FileText,
        title: 'Digital Payslips & Reports',
        description:
            'Generate detailed payslips, payroll summaries, cost-center reports, and government filings in one click.',
    },
    {
        icon: BarChart3,
        title: 'Analytics & Insights',
        description:
            'Visualize labor costs, headcount trends, overtime patterns, and budget forecasts with real-time dashboards.',
    },
];

export default function FeaturesSection() {
    return (
        <section id="features" className="bg-white py-20 dark:bg-[#0a0a0a] sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-[#1E1B4B] sm:text-4xl dark:text-white">
                        Everything you need to run payroll
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                        One platform. Every tool. Zero complexity.
                    </p>
                </div>

                <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="group rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:border-teal-200 hover:shadow-lg hover:shadow-teal-500/5 dark:border-gray-800 dark:bg-[#0B0B2B]/50 dark:hover:border-teal-500/30"
                        >
                            <div className="mb-5 inline-flex rounded-xl bg-teal-500/10 p-3">
                                <feature.icon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                            </div>
                            <h3 className="mb-3 text-lg font-semibold text-[#1E1B4B] dark:text-white">
                                {feature.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
