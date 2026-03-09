"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import {
  ClassSidebar,
} from "@/ui/features/classDashboard/components";
import {
  AssignmentHeader,
  AssignmentInstructions,
  ReferenceMaterials,
  StudentPortal,
  type UploadedFile
} from "@/ui/features/assignment/components";
import CodeEditorView from "@/ui/features/assignment/components/CodeEditorView";
import { MOCK_ASSIGNMENT } from "@/config/assignment";
import { useSubmissions, useZipExtractor } from "@/ui/hooks";

type TabId = "general" | "assignment" | "posts" | "students" | "files" | "grades";

export default function AssignmentDetailClient() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;
  const [activeTab] = useState<TabId>("assignment");

  const classId = "flutter";

  const { uploadedFiles, addFiles, removeFile } = useSubmissions(assignmentId, "1");
  const { editorFiles, showCodeEditor, extractAndOpen, openFileInEditor, closeEditor } = useZipExtractor();

  const handleTabChange = () => {
    router.push(`/class/${classId}`);
  };

  const handleUploadComplete = useCallback((data: unknown) => {
    console.log("Upload complete:", data);
  }, []);

  const handleFileClick = useCallback(async (file: UploadedFile) => {
    if (!file.path) return;

    if (file.name.toLowerCase().endsWith(".zip")) {
      try {
        await extractAndOpen(file.path);
      } catch {
        alert("Could not extract ZIP file.");
      }
    } else {
      try {
        await openFileInEditor(file.path, file.name);
      } catch {
        alert("Could not preview file. The file might not be accessible.");
      }
    }
  }, [extractAndOpen, openFileInEditor]);

  const assignment = MOCK_ASSIGNMENT;

  return (
    <>
      {showCodeEditor && (
        <CodeEditorView
          files={editorFiles}
          onClose={closeEditor}
        />
      )}

      <div className={`h-screen bg-white flex overflow-hidden ${showCodeEditor ? 'hidden' : ''}`}>
        <ClassSidebar classId={classId} activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex-1 flex flex-col min-w-0">
        <AssignmentHeader />

        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{assignment.title}</h1>
                  <p className="text-slate-600">{assignment.description}</p>
                </div>
                <AssignmentInstructions
                  dueDate={assignment.dueDate}
                  objective={assignment.objective}
                  requirements={assignment.requirements}
                  gradingRubric={assignment.gradingRubric}
                />
                <ReferenceMaterials materials={assignment.referenceMaterials} />
              </div>

              <div className="space-y-6">
                <StudentPortal
                  status={assignment.status}
                  progress={assignment.progress}
                  progressPercent={assignment.progressPercent}
                  submittedAt={assignment.submittedAt}
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
    </>
  );
}
