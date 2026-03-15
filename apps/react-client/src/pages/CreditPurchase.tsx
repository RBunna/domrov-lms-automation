import MainNavigation from "@/components/navigation/Navigation";
import CreditPurchaseClient from "@/features/CreditPurchase/CreditPurchaseClient";
import ProfileDropdown from "@/components/data-display/ProfileDropdown";

/**
 * CreditPurchasePage - Main page for purchasing tokens.
 * Uses portal layout with sidebar navigation.
 */
export default function CreditPurchasePage() {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <MainNavigation activeId="credit" />
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <header className="bg-primary text-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-blue-100">Dashboard</p>
                        <h1 className="text-xl font-semibold">Wallet</h1>
                    </div>
                    <ProfileDropdown buttonClassName="bg-white text-primary hover:bg-blue-50" />
                </header>
                <CreditPurchaseClient />
            </div>
        </div>
    );
}