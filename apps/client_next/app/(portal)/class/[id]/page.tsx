import type { Metadata } from "next";
import ClassDashboardClient from "@/ui/features/classDashboard/components/ClassDashboardClient";

export const metadata: Metadata = {
  title: "Class | Domrov LMS",
  description: "View class details, assignments, and grades",
};

export default function ClassDashboardPage() {
  return <ClassDashboardClient />;
}
