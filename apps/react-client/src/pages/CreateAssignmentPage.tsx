import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import CreateAssignmentForm from "@/features/assignment/CreateAssignmentForm";
import ClassSidebar from "@/features/classDashboard/ClassSidebar";
import MainNavigation from "@/components/navigation/Navigation";
import { useState } from "react";

export default function CreateAssignmentPage() {
  const params = useParams();
  const navigate = useNavigate();
  const classId = params.id as string;
  const [activeTab, setActiveTab] = useState<"general" | "assignment" | "posts" | "students" | "files" | "grades">("assignment");

  if (!classId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">Error: Class ID not found</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MainNavigation activeId="classes" />
      <ClassSidebar 
        classId={classId} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        allowedTabs={["general", "assignment", "posts", "students", "files", "grades"]}
      />
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200 bg-white">
          <button
            onClick={() => navigate(`/class/${classId}`)}
            className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
            title="Back to class"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create Assignment</h1>
            <p className="text-sm text-slate-600">Add a new assignment to your class</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <CreateAssignmentForm classId={classId} />
        </div>
      </div>
    </div>
  );
}
