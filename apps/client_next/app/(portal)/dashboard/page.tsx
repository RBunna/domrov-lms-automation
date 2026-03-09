import type { Metadata } from "next";
import DashboardClient from "@/ui/features/dashboard/components/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | Domrov LMS",
  description: "Manage your classes and assignments",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
