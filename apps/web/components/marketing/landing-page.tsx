'use client';

import { Navbar } from '@/components/marketing/navbar';
import { Hero } from '@/components/marketing/hero';
import { Features } from '@/components/marketing/features';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { ForTutors } from '@/components/marketing/for-tutors';
import { Preview } from '@/components/marketing/preview';
import { Cta } from '@/components/marketing/cta';
import { Footer } from '@/components/marketing/footer';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <ForTutors />
      <Preview />
      <Cta />
      <Footer />
    </div>
  );
}
