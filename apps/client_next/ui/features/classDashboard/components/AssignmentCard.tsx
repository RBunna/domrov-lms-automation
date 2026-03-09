"use client";

import { useRouter } from "next/navigation";
import { ClipboardIcon } from "./icons";
import StatusBadge from "@/ui/design-system/primitives/StatusBadge";

interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  dueTime: string;
  relativeDate: string;
  module: string;
  status?: "submitted" | "feedback" | "inactive";
  additionalStatus?: "feedback";
}

interface AssignmentCardProps {
  assignment: Assignment;
}

/**
 * AssignmentCard - Individual assignment card display.
 * Redesigned to match the reference design with better visual hierarchy.
 */
export default function AssignmentCard({ assignment }: AssignmentCardProps) {
  const router = useRouter();

  const getStatusBadges = () => {
    if (!assignment.status) return null;

    return (
      <div className="flex gap-2">
        <StatusBadge status={assignment.status} />
        {assignment.additionalStatus === "feedback" && (
          <StatusBadge status="feedback" />
        )}
      </div>
    );
  };

  return (
    <div
      onClick={() => router.push(`/assignment/${assignment.id}`)}
      className="bg-white border border-slate-300 rounded-xl p-5 hover:shadow-lg hover:border-slate-400 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <h4 className="font-semibold text-slate-900 text-lg">{assignment.title}</h4>
          <p className="text-sm text-red-600 font-medium">
            Due at {assignment.dueTime}
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ClipboardIcon className="w-4 h-4 text-slate-500" />
            <span>{assignment.module}</span>
          </div>
        </div>
        {getStatusBadges()}
      </div>
    </div>
  );
}
