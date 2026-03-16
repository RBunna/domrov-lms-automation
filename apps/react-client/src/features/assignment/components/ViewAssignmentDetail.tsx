"use client";

import { ArrowLeft } from "lucide-react";
import StudentSubmissionsTable from "@/features/assignment/components/StudentSubmissionsTable";
import type { AssignmentDetailsData } from "@/data/mockAssignmentDetails";

interface ViewAssignmentDetailProps {
  data: AssignmentDetailsData;
  onBack: () => void;
}

export default function ViewAssignmentDetail({ data, onBack }: ViewAssignmentDetailProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 bg-white border rounded-lg border-slate-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-3 text-sm transition-colors text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assignments</span>
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="mb-1 text-xl font-bold text-slate-900">
              {data.assignment.title}
            </h2>
            <p className="text-sm text-slate-600 line-clamp-2">
              {data.assignment.description}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="inline-block bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
              <p className="text-xs font-medium text-blue-600">DUE DATE</p>
              <p className="text-sm font-bold text-blue-700">{data.assignment.dueDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Submissions Table */}
      <div className="p-4 bg-white border rounded-lg border-slate-200">
        <StudentSubmissionsTable students={data.students} />
      </div>
    </div>
  );
}
