"use client";

import { CheckCircleIcon, ChevronRightIcon, InfoIcon } from "@/ui/features/classDashboard/components/icons";
import UploadSection, { UploadedFile } from "./UploadSection";

interface StudentPortalProps {
  status: string;
  progress: { current: number; total: number };
  progressPercent: number;
  submittedAt?: string;
  uploadedFiles: UploadedFile[];
  onFilesAdded: (files: UploadedFile[]) => void;
  onFileRemoved: (index: number) => void;
  assignmentId?: string;
  userId?: string;
  onUploadComplete?: (data: unknown) => void;
  onFileClick?: (file: UploadedFile) => void;
}

/**
 * StudentPortal - Complete student portal with progress, upload, and help sections
 */
export default function StudentPortal({
  status,
  progress: _progress,
  progressPercent: _progressPercent,
  submittedAt,
  uploadedFiles,
  onFilesAdded,
  onFileRemoved,
  assignmentId = "default",
  userId = "1",
  onUploadComplete,
  onFileClick
}: StudentPortalProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-6 mt-8">
      {/* Upload Section */}
      <div className="p-6">
        <UploadSection 
          uploadedFiles={uploadedFiles}
          onFilesAdded={onFilesAdded}
          onFileRemoved={onFileRemoved}
          assignmentId={assignmentId}
          userId={userId}
          onUploadComplete={onUploadComplete}
          onFileClick={onFileClick}
        />

        {/* Submission Status */}
        {status === "SUBMITTED" && submittedAt && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 mt-6">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-green-900 mb-1">Submission Received</h4>
                <p className="text-xs text-green-700">Time: {submittedAt}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 mb-6 mt-6">
          <button className="w-full px-6 py-4 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-2">
            <span>Submit Assignment</span>
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          
        </div>

        {/* Need Help Section */}
        <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl p-6">
          <h4 className="text-base font-bold text-white mb-2">Need Help?</h4>
          <p className="text-sm text-slate-300 mb-4">If you encounter issues during upload, please contact our support team immediately.</p>
          <button className="w-full px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
            <InfoIcon className="w-5 h-5" />
            <span>Contact Support</span>
          </button>
        </div>
      </div>
    </div>
  );
}
