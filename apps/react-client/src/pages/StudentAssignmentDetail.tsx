import { useState, useCallback, useEffect } from "react";
import { useSubmissions, useZipExtractor } from "@/hooks";
import AssignmentInstructions from "@/features/assignment/AssignmentInstructions";
import CodeEditorView from "@/features/assignment/CodeEditorView";
import ReferenceMaterials from "@/features/assignment/ReferenceMaterials";
import StudentPortal from "@/features/assignment/StudentSubmission";
import assessmentService from "@/services/assessmentService";
import type { UploadedFile } from "@/features/assignment/UploadSection";
import type { AssessmentDetailDto } from "@/types/assessment";
import { useNavigate } from "react-router-dom";

interface StudentAssignmentDetailProps {
  classId: string;
  assignmentId: string;
  onBack: () => void;
}

export default function StudentAssignmentDetail({
  classId,
  assignmentId,
  onBack,
}: StudentAssignmentDetailProps) {
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<AssessmentDetailDto | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        setIsLoading(true);
        const data = await assessmentService.getAssessmentDetails(
          Number(assignmentId),
        );
        const assignmentData = (data as any).data ?? data;
        setAssignment(assignmentData);
      } catch (err) {
        console.error("Failed to load assignment:", err);
        setError("Could not load assignment details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignmentDetails();
  }, [assignmentId]);

  const { uploadedFiles, addFiles, removeFile } = useSubmissions(
    assignmentId,
    "1",
  );
  const {
    editorFiles,
    showCodeEditor,
    extractAndOpen,
    openFileInEditor,
    closeEditor,
  } = useZipExtractor();

  const handleEditAssignment = () => {
    navigate(`/class/${classId}/assignment/${assignmentId}/edit`);
  };

  const handleUploadComplete = useCallback((data: unknown) => {
    console.log("Upload complete:", data);
  }, []);

  const handleFileClick = useCallback(
    async (file: UploadedFile) => {
      if (!file.path) return;
      if (file.name.toLowerCase().endsWith(".zip")) {
        try {
          await extractAndOpen();
        } catch {
          alert("Could not extract ZIP file.");
        }
      } else {
        try {
          await openFileInEditor(file.path, file.name);
        } catch {
          alert("Could not preview file.");
        }
      }
    },
    [extractAndOpen, openFileInEditor],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-slate-50">
        <div className="text-lg text-slate-600 animate-pulse">
          Loading assignment details...
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50">
        <div className="text-lg text-red-600 mb-4">
          {error || "Assignment not found."}
        </div>
        <button onClick={onBack} className="text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const mappedMaterials =
    assignment.resources?.map((r: any) => ({
      name: r.resource.title || "Untitled Document",
      type: r.resource.type || "link",
      url: r.resource.url || "#",
    })) || [];

  const mappedRubrics =
    assignment.rubrics?.map(
      (r: any) => `${r.definition} (${r.totalScore} points)`,
    ) || [];

  const mappedRequirements =
    assignment.instruction && assignment.instruction.includes("\n")
      ? assignment.instruction
          .split("\n")
          .filter((line) => line.trim().length > 0)
      : [];

  const isSubmitted = uploadedFiles.length > 0;

  const submissionStatus = isSubmitted ? "SUBMITTED" : "PENDING";

  const submissionProgress = { current: isSubmitted ? 1 : 0, total: 1 };
  const submissionPercent = isSubmitted ? 100 : 0;

  return (
    <div className="flex flex-col flex-1 min-w-0 animate-fadeIn">
      <div className="px-8 pt-6 pb-2">
        <button
          onClick={onBack}
          className="flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          &larr; Back to assignments
        </button>
      </div>

      {showCodeEditor && (
        <CodeEditorView files={editorFiles} onClose={closeEditor} />
      )}

      <div
        className={`flex flex-col flex-1 min-w-0 ${showCodeEditor ? "hidden" : ""}`}
      >
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-8 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
              <div className="space-y-6">
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-slate-900">
                    {assignment.title}
                  </h1>
                  <p className="text-slate-600 whitespace-pre-line">
                    {assignment.instruction}
                  </p>
                </div>

                <AssignmentInstructions
                  dueDate={String(assignment.dueDate)}
                  objective="Complete the requirements defined below."
                  requirements={mappedRequirements}
                  gradingRubric={mappedRubrics}
                  onEdit={handleEditAssignment}
                />

                <ReferenceMaterials materials={mappedMaterials} />
              </div>

              <div className="space-y-6">
                <StudentPortal
                  status={submissionStatus}
                  progress={submissionProgress}
                  progressPercent={submissionPercent}
                  submittedAt={
                    isSubmitted ? new Date().toLocaleString() : undefined
                  }
                  uploadedFiles={uploadedFiles}
                  onFilesAdded={addFiles}
                  onFileRemoved={removeFile}
                  assignmentId={assignmentId}
                  userId="1"
                  onUploadComplete={handleUploadComplete}
                  onFileClick={handleFileClick}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
