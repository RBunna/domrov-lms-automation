import type { Metadata } from "next";
import CoreFeaturesSection from "@/ui/components/landing/CoreFeaturesSection";
import HowItWorksSection from "@/ui/components/landing/HowItWorksSection";
import LandingCTA from "@/ui/components/landing/LandingCTA";
import LandingHero from "@/ui/components/landing/LandingHero";
import ProblemSolutionSection from "@/ui/components/landing/ProblemSolutionSection";

export const metadata: Metadata = {
  title: "Domrov LMS - AI-Powered Code Grading for Cambodia",
  description: "Automated grading with human oversight. Reduce manual grading workload by 80% with AI-driven feedback.",
};

export default function LandingPage() {
  return (
    <main>
      <LandingHero />
      <ProblemSolutionSection />
      <CoreFeaturesSection />
      <HowItWorksSection />
      <LandingCTA />
    </main>
  );
}
