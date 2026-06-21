import { Star } from 'lucide-react';

export default function SocialProofSection() {
    return (
        <section id="testimonials" className="bg-white py-20 dark:bg-[#0a0a0a] sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <div className="mb-6 inline-flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={`star-${i}`}
                                className="h-5 w-5 fill-amber-400 text-amber-400"
                            />
                        ))}
                    </div>
                    <blockquote className="text-2xl font-medium leading-relaxed text-[#1E1B4B] sm:text-3xl dark:text-white">
                        &ldquo;Payvolve transformed how we handle payroll. What used to take our team two
                        full days now takes 15 minutes. The automated tax filing alone has saved us from
                        multiple headaches.&rdquo;
                    </blockquote>
                    <div className="mt-8">
                        <div className="font-semibold text-[#1E1B4B] dark:text-white">
                            Sarah Chen
                        </div>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            CFO, Meridian Technologies — 250 employees
                        </div>
                    </div>

                    <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
                        {['88%', '9/10', '4.8/5', '30min'].map((stat, i) => (
                            <div key={`stat-${i}`}>
                                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                    {stat}
                                </div>
                                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {[
                                        'Compliance confidence',
                                        'Would recommend',
                                        'Avg customer rating',
                                        'Avg setup time',
                                    ][i]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
