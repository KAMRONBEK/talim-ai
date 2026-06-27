'use client';

import { Navbar } from '@/components/marketing/navbar';
import { Pricing } from '@/components/marketing/pricing';
import { Footer } from '@/components/marketing/footer';

export default function PricingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <Pricing />
      <Footer />
    </div>
  );
}
