import type { Metadata } from "next";
import DocsHero from "@/ui/features/docs/components/DocsHero";
import DocumentationLayout from "@/ui/features/docs/components/DocumentationLayout";

export const metadata: Metadata = {
  title: "Documentation | Domrov LMS",
  description: "User guidelines for Students, Teachers, Admins, and Quiz Operators on using Domrov LMS.",
};

export default function DocumentationPage() {
  return (
    <div className="flex-1 flex flex-col">
      <DocsHero />
      <DocumentationLayout />
    </div>
  );
}
