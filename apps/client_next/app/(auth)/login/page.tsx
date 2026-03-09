import type { Metadata } from "next";
import Header from "@/ui/components/layout/Header";
import Footer from "@/ui/components/layout/Footer";
import SectionWrapper from "@/ui/design-system/primitives/SectionWrapper";
import LoginCard from "@/ui/features/login/components/LoginCard";

export const metadata: Metadata = {
  title: "Sign In | Domrov LMS",
  description: "Sign in to your Domrov LMS account.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <Header />
      <SectionWrapper>
        <LoginCard />
      </SectionWrapper>
      <Footer />
    </div>
  );
}
