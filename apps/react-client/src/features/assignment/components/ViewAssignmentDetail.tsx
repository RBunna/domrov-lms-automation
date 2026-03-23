"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import StudentSubmissionsTable from "@/features/assignment/components/StudentSubmissionsTable";
import assessmentService from "@/services/assessmentService";
import type { AssessmentDetailDto } from "@/types/assessment";
import type { AssignmentDetailsData } from "@/data/mockAssignmentDetails"; // Imported AssignmentDetailsData

interface ViewAssignmentDetailProps {
  data?: AssignmentDetailsData; // Made data optional to handle undefined cases
  onBack: () => void;
  assignmentId?: number;
}

function formatDueDate(raw: string | Date): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function ViewAssignmentDetail({ assignmentId, onBack }: ViewAssignmentDetailProps) {
  const [assignment, setAssignment] = useState<AssessmentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!assignmentId) {
          throw new Error("assignmentId is required");
        }
        const data = await assessmentService.getAssessmentDetails(assignmentId);
        if (!cancelled) setAssignment(data);
      } catch (err: any) {
        console.error("❌ Failed to load assignment details:", err);
        if (!cancelled) setError("Could not load assignment details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [assignmentId]);

  const BackButton = () => (
    <button
      onClick={onBack}
      className="flex items-center gap-2 mb-3 text-sm transition-colors text-slate-600 hover:text-slate-900"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Assignments
    </button>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-white border rounded-lg border-slate-200">
          <BackButton />
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-slate-500">Loading assignment...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-white border rounded-lg border-slate-200">
          <BackButton />
          <p className="text-sm text-red-500 text-center py-8">{error ?? "Assignment not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 bg-white border rounded-lg border-slate-200">
        <BackButton />
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="mb-1 text-xl font-bold text-slate-900">{assignment.title}</h2>
            <p className="text-sm text-slate-600 line-clamp-2">{assignment.instruction}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span>Session {assignment.session}</span>
              <span>Max Score: {assignment.maxScore}</span>
              <span>{assignment.submissionType}</span>
              <span>{assignment.allowedSubmissionMethod}</span>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="inline-block bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
              <p className="text-xs font-medium text-blue-600">DUE DATE</p>
              <p className="text-sm font-bold text-blue-700">{formatDueDate(assignment.dueDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Submissions */}
      <div className="p-4 bg-white border rounded-lg border-slate-200">
        {/* <StudentSubmissionsTable
          
          assignmentId={assignmentId!} 
        /> */}
      </div>
    </div>
  );
}