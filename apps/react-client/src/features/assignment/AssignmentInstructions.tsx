"use client";

import { AlertCircle, Info, Download, Edit2 } from "lucide-react";

interface AssignmentInstructionsProps {
  dueDate: string;
  objective: string;
  requirements: string[];
  gradingRubric: string;
  onEdit?: () => void;
}

/**
 * AssignmentInstructions - Card displaying assignment instructions, objectives, and requirements
 */
export default function AssignmentInstructions({
  dueDate,
  objective,
  requirements,
  gradingRubric,
  onEdit
}: AssignmentInstructionsProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Assignment Instructions</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Due: {dueDate}
            </span>
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
                title="Edit assignment"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Objective Section */}
        <div className="mb-6">
          <h3 className="text-base font-bold text-slate-900 mb-3">Objective</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{objective}</p>
        </div>

        {/* Requirements Section */}
        <div className="mb-6">
          <h3 className="text-base font-bold text-slate-900 mb-3">Requirements</h3>
          <ul className="space-y-2">
            {requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                <span className="leading-relaxed">{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Grading Rubric Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Grading Rubric Available</h4>
              <p className="text-sm text-slate-600 mb-3">Review the criteria for performance, code structur and documentation.</p>
              <button className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                {gradingRubric}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
