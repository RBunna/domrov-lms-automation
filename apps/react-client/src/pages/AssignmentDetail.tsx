import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import MainNavigation from "@/components/navigation/Navigation";
import { MOCK_ASSIGNMENT } from "@/config";
import { useSubmissions, useZipExtractor } from "@/hooks";
import { ClassSidebar } from "@/features/classDashboard";
import AssignmentHeader from "@/features/assignment/AssignmentHeader";
import AssignmentInstructions from "@/features/assignment/AssignmentInstructions";
import CodeEditorView from "@/features/assignment/CodeEditorView";
import ReferenceMaterials from "@/features/assignment/ReferenceMaterials";
import StudentPortal from "@/features/assignment/StudentSubmission";
import classService from "@/services/classService";
import type { UploadedFile } from "@/features/assignment/UploadSection";

type TabId = "general" | "assignment" | "posts" | "students" | "files" | "grades";

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const assignmentId = id || "";

  const [activeTab] = useState<TabId>("assignment");
  const [role, setRole] = useState<string | null>(null);

  // Get classId from location.state or URL params
  // It should be passed when navigating to this page
  const classId = location.state?.classId || (useParams<{ classId?: string }>().classId as string) || "flutter";

  // Fetch role for this class
  useEffect(() => {
    const fetchClassRole = async () => {
      try {
        const classData = await classService.getClass(parseInt(classId));
        setRole(classData.role || "Student"); // Default to Student, not Teacher
      } catch (err) {
        console.error("Failed to fetch class role:", err);
        setRole("Student"); // Default to Student on error
      }
    };

    if (classId && classId !== "flutter") {
      fetchClassRole();
    } else {
      setRole("Student"); // Default for mock data
    }
  }, [classId]);

  const { uploadedFiles, addFiles, removeFile } = useSubmissions(assignmentId, "1");
  const { editorFiles, showCodeEditor, extractAndOpen, openFileInEditor, closeEditor } = useZipExtractor();

  const handleTabChange = () => {
    navigate(`/class/${classId}`);
  };

  const handleEditAssignment = () => {
    navigate(`/class/${classId}/assignment/${assignmentId}/edit`);
  };

  const handleUploadComplete = useCallback((data: unknown) => {
    console.log("Upload complete:", data);
  }, []);

  const handleFileClick = useCallback(async (file: UploadedFile) => {
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
        alert("Could not preview file. The file might not be accessible.");
      }
    }
  }, [extractAndOpen, openFileInEditor]);

  const assignment = MOCK_ASSIGNMENT;

  // Normalize role
  const normalizedRole = role === "Teacher" || role === "Instructor" ? "Teacher" : "Student";
  const allowedTabs: TabId[] = normalizedRole === "Teacher"
    ? ["general", "assignment", "posts", "students", "files", "grades"]
    : ["general", "assignment", "posts", "files", "grades"];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MainNavigation activeId="classes" />
      <div className="flex flex-col flex-1 min-w-0">
        {showCodeEditor && (
          <CodeEditorView
            files={editorFiles}
            onClose={closeEditor}
          />
        )}

        <div className={`h-screen bg-white flex overflow-hidden ${showCodeEditor ? 'hidden' : ''}`}>
          <ClassSidebar classId={classId} activeTab={activeTab} onTabChange={handleTabChange} allowedTabs={allowedTabs} />

          <div className="flex flex-col flex-1 min-w-0">
            <AssignmentHeader />

            <div className="flex-1 overflow-y-auto bg-slate-50">
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
                  <div className="space-y-6">
                    <div>
                      <h1 className="mb-2 text-3xl font-bold text-slate-900">{assignment.title}</h1>
                      <p className="text-slate-600">{assignment.description}</p>
                    </div>
                    <AssignmentInstructions
                      dueDate={assignment.dueDate}
                      objective={assignment.objective}
                      requirements={assignment.requirements}
                      gradingRubric={assignment.gradingRubric}
                      onEdit={handleEditAssignment}
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
      </div>
    </div>
  );
}
