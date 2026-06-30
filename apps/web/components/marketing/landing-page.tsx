'use client';

import { Navbar } from '@/components/marketing/navbar';
import { Hero } from '@/components/marketing/hero';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { Features } from '@/components/marketing/features';
import { ForTutors } from '@/components/marketing/for-tutors';
import { PricingSection } from '@/components/marketing/pricing-section';
import { Stats } from '@/components/marketing/stats';
import { Testimonials } from '@/components/marketing/testimonials';
import { Faq } from '@/components/marketing/faq';
import { Cta } from '@/components/marketing/cta';
import { Footer } from '@/components/marketing/footer';

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <ForTutors />
      <PricingSection />
      <Stats />
      <Testimonials />
      <Faq />
      <Cta />
      <Footer />
    </div>
  );
}
