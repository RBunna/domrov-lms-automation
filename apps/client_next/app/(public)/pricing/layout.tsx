import MainNavigation from "@/ui/components/navigation/Navigation";

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  // For pricing, lock icon is active
  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <MainNavigation activeId="lock" />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
