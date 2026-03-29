"use client";

import { CheckCircle, ChevronRight, Info } from "lucide-react";
import UploadSection from "./UploadSection";
import type { UploadedFile } from "./UploadSection";

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
  onFileClick,
}: StudentPortalProps) {
  return (
    <div className="sticky mt-8 bg-white border shadow-sm rounded-2xl border-slate-200 top-6">
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

        {status === "SUBMITTED" && submittedAt && (
          <div className="p-4 mt-6 mb-6 border border-green-200 bg-green-50 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="mb-1 text-sm font-bold text-green-900">
                  Submission Received
                </h4>
                <p className="text-xs text-green-700">Time: {submittedAt}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 mb-6 space-y-3">
          <button className="flex items-center justify-center w-full gap-2 px-6 py-4 font-bold text-white transition-all shadow-lg bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40">
            <span>Submit Assignment</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-linear-to-br from-slate-800 to-slate-900 rounded-xl">
          <h4 className="mb-2 text-base font-bold text-white">Need Help?</h4>
          <p className="mb-4 text-sm text-slate-300">
            If you encounter issues during upload, please contact our support
            team immediately.
          </p>
          <button className="flex items-center justify-center w-full gap-2 px-6 py-3 font-semibold transition-all bg-white hover:bg-slate-100 text-slate-900 rounded-xl">
            <Info className="w-5 h-5" />
            <span>Contact Support</span>
          </button>
        </div>
      </div>
    </div>
  );
}
