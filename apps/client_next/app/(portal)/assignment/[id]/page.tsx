import type { Metadata } from "next";
import AssignmentDetailClient from "@/ui/features/assignment/components/AssignmentDetailClient";

export const metadata: Metadata = {
  title: "Assignment | Domrov LMS",
  description: "View assignment details and submit your work",
};

export default function AssignmentDetailPage() {
  return <AssignmentDetailClient />;
}
