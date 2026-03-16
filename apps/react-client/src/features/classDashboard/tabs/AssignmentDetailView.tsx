"use client";

import { ArrowLeft } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import type { AssessmentListItemDto } from "@/types";

interface AssignmentDetailViewProps {
  assignment: AssessmentListItemDto;
  onBack: () => void;
}

export default function AssignmentDetailView({
  assignment,
  onBack,
}: AssignmentDetailViewProps) {
  return (
    <AnimatedPage>
      <div className="p-6 max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Assignments
        </button>

        <div className="bg-white rounded-lg border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            {assignment.title}
          </h1>

          <div className="grid grid-cols-2 gap-6 mb-8 pb-8 border-b border-slate-200">
            <div>
              <p className="text-sm text-slate-600 mb-1">Due Date</p>
              <p className="text-lg font-semibold text-slate-900">
                {assignment.dueDate
                  ? new Date(assignment.dueDate).toLocaleString()
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Session</p>
              <p className="text-lg font-semibold text-slate-900">
                Session {assignment.session}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Details
            </h2>
            <p className="text-slate-700">
              Assignment ID: {assignment.id}
            </p>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
