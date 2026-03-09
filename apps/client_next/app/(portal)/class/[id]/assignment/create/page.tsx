import { use } from "react";
import type { Metadata } from "next";
import CreateAssignmentForm from "@/ui/features/assignment/components/create/CreateAssignmentForm";

export const metadata: Metadata = {
  title: "Create Assignment | Domrov LMS",
  description: "Create a new assignment for your class",
};

export default function CreateAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const classId = use(params).id;

  return <CreateAssignmentForm classId={classId} />;
}
