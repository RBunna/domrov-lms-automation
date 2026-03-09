import Header from "@/ui/components/layout/Header";
import Footer from "@/ui/components/layout/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 animate-in fade-in duration-500">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
