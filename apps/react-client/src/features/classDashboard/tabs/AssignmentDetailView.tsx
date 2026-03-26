"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import type { AssessmentDetailDto } from "@/types/assessment";
import { getAssessmentDetails } from "@/services/assessmentService";

interface AssignmentDetailViewProps {
  assessmentId: number;
  onBack: () => void;
}

export default function AssignmentDetailView({ assessmentId, onBack }: AssignmentDetailViewProps) {
  const [assignment, setAssignment] = useState<AssessmentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAssessmentDetails(assessmentId)
      .then(data => {
        setAssignment(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load assignment details.");
        setLoading(false);
      });
  }, [assessmentId]);

  return (
    <AnimatedPage>
      <div className="max-w-4xl p-6 mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-6 text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Assignments
        </button>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {assignment && (
          <div className="p-8 bg-white border rounded-lg border-slate-200">
            <h1 className="mb-4 text-3xl font-bold text-slate-900">
              {assignment.title}
            </h1>

            <div className="grid grid-cols-2 gap-6 pb-8 mb-8 border-b border-slate-200">
              <div>
                <p className="mb-1 text-sm text-slate-600">Due Date</p>
                <p className="text-lg font-semibold text-slate-900">
                  {assignment.dueDate
                    ? new Date(assignment.dueDate).toLocaleString()
                    : "-"}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm text-slate-600">Session</p>
                <p className="text-lg font-semibold text-slate-900">
                  Session {assignment.session}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Details</h2>
              <p className="mb-2 text-slate-700">Assignment ID: {assignment.id}</p>
              <p className="mb-2 text-slate-700">Instruction: {assignment.instruction}</p>
              <p className="mb-2 text-slate-700">Max Score: {assignment.maxScore}</p>
              <p className="mb-2 text-slate-700">AI Evaluation: {assignment.aiEvaluationEnable ? "Enabled" : "Disabled"}</p>
              {assignment.class && (
                <p className="mb-2 text-slate-700">Class: {assignment.class.name || assignment.class.id}</p>
              )}
              {assignment.aiModel && (
                <p className="mb-2 text-slate-700">AI Model: {assignment.aiModel.name}</p>
              )}
            </div>

            {assignment.rubrics && assignment.rubrics.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Rubrics</h3>
                <ul className="pl-5 list-disc">
                  {assignment.rubrics.map(rubric => (
                    <li key={rubric.id} className="mb-1">
                      {rubric.definition} (Total Score: {rubric.totalScore})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {assignment.resources && assignment.resources.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Resources</h3>
                <ul className="pl-5 list-disc">
                  {assignment.resources.map(res => (
                    <li key={res.id} className="mb-1">
                      {res.resource.title} {res.resource.url && (<a href={res.resource.url} className="ml-2 text-blue-600 underline" target="_blank" rel="noopener noreferrer">Link</a>)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {assignment.user_include_files && assignment.user_include_files.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">User Include Files</h3>
                <ul className="pl-5 list-disc">
                  {assignment.user_include_files.map((file, idx) => (
                    <li key={idx}>{file}</li>
                  ))}
                </ul>
              </div>
            )}

            {assignment.user_exclude_files && assignment.user_exclude_files.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">User Exclude Files</h3>
                <ul className="pl-5 list-disc">
                  {assignment.user_exclude_files.map((file, idx) => (
                    <li key={idx}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
