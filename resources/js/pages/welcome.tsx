import { Head } from '@inertiajs/react';
import FeaturesSection from '@/components/landing/features';
import FooterCtaSection from '@/components/landing/footer-cta';
import HeroSection from '@/components/landing/hero';
import HowItWorksSection from '@/components/landing/how-it-works';
import LandingNavbar from '@/components/landing/navbar';
import SocialProofSection from '@/components/landing/social-proof';

export default function Welcome() {
    return (
        <>
            <Head title="Payvolve — Payroll, Simplified" />
            <LandingNavbar />
            <main>
                <HeroSection />
                <FeaturesSection />
                <HowItWorksSection />
                <SocialProofSection />
            </main>
            <FooterCtaSection />
        </>
    );
}
