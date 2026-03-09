import type { Metadata } from "next";
import PricingHero from "@/ui/features/pricing/components/PricingHero";
import PricingGrid from "@/ui/features/pricing/components/PricingGrid";

export const metadata: Metadata = {
  title: "Pricing | Domrov LMS",
  description: "Choose the right plan for your institution. Affordable AI-powered code grading for every team size.",
};

export default function PricingPage() {
  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20">
      <PricingHero />
      <PricingGrid />
    </main>
  );
}
