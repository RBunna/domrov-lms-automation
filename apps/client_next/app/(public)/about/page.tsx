import type { Metadata } from "next";
import AboutHero from "@/ui/features/about/components/AboutHero";
import VisionCards from "@/ui/features/about/components/VisionCards";
import MissionSection from "@/ui/features/about/components/MissionSection";
import TeamSection from "@/ui/features/about/components/TeamSection";

export const metadata: Metadata = {
  title: "About Us | Domrov LMS",
  description: "Learn about Domrov's mission to transform coding education in Cambodia with AI-powered grading.",
};

export default function AboutUsPage() {
  return (
    <>
      <AboutHero />
      <VisionCards />
      <MissionSection />
      <TeamSection />
    </>
  );
}
