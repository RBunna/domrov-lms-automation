import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/primitives/SectionWrapper";
import { LoginCard } from "@/features/login";

/**
 * Login - Login page component.
 * Displays the login form and authentication options.
 */
export default function Login() {
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