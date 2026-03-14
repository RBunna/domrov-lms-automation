import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Eye, Trash2, ClipboardList, Users, FileText } from "lucide-react";

// Interface matching CreateAssignmentForm data structure
interface CreateAssignmentData {
  title: string;
  session: string;
  submissionType: "individual" | "group";
  instructions: string;
  startDate: string;
  startTime: string;
  dueDate: string;
  dueTime: string;
  maxScore: number;
  allowedSubmissionMethod: string;
  allowLateSubmissions: boolean;
  aiEvaluationEnabled: boolean;
  learningResources: File[];
}

// Extended interface for teacher view (includes CreateAssignmentData fields + view-specific fields)
interface TeacherAssignment extends CreateAssignmentData {
  id: string;
  status: "draft" | "published" | "archived";
  submissionRate: number; // 0-100 percentage
}

// Mock data for teacher's assignments - based on CreateAssignmentData structure
const INITIAL_ASSIGNMENTS: TeacherAssignment[] = [
  {
    id: "1",
    title: "Database Design Project",
    session: "2024",
    submissionType: "group",
    instructions: "Design a normalized database for an e-commerce platform",
    startDate: "2024-03-01",
    startTime: "09:00",
    dueDate: "2024-03-15",
    dueTime: "23:59",
    maxScore: 100,
    allowedSubmissionMethod: "file",
    allowLateSubmissions: false,
    aiEvaluationEnabled: true,
    learningResources: [],
    status: "published",
    submissionRate: 92,
  },
  {
    id: "2",
    title: "Calculus Problem Set",
    session: "2024",
    submissionType: "individual",
    instructions: "Solve 20 calculus problems covering integration and differentiation",
    startDate: "2024-03-05",
    startTime: "08:00",
    dueDate: "2024-03-20",
    dueTime: "17:00",
    maxScore: 50,
    allowedSubmissionMethod: "both",
    allowLateSubmissions: true,
    aiEvaluationEnabled: false,
    learningResources: [],
    status: "draft",
    submissionRate: 0,
  },
  {
    id: "3",
    title: "Essay on Modern History",
    session: "2024",
    submissionType: "individual",
    instructions: "Write a 3000-word essay on the causes of World War II",
    startDate: "2024-02-28",
    startTime: "00:00",
    dueDate: "2024-03-25",
    dueTime: "23:59",
    maxScore: 100,
    allowedSubmissionMethod: "text",
    allowLateSubmissions: false,
    aiEvaluationEnabled: true,
    learningResources: [],
    status: "published",
    submissionRate: 85,
  },
  {
    id: "4",
    title: "Chemistry Lab Report",
    session: "2024",
    submissionType: "group",
    instructions: "Document your lab experiment with methodology, results, and analysis",
    startDate: "2024-03-10",
    startTime: "10:00",
    dueDate: "2024-03-22",
    dueTime: "18:00",
    maxScore: 75,
    allowedSubmissionMethod: "file",
    allowLateSubmissions: false,
    aiEvaluationEnabled: false,
    learningResources: [],
    status: "published",
    submissionRate: 78,
  },
];

const STATISTICS = [
  {
    value: "12",
    label: "ACTIVE ASSIGNMENTS",
    icon: ClipboardList,
  },
  {
    value: "85%",
    label: "SUBMISSION RATE",
    icon: Users,
  },
  {
    value: "4",
    label: "DRAFTS TO FINISH",
    icon: FileText,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "published":
      return "bg-green-100 text-green-700";
    case "draft":
      return "bg-gray-100 text-gray-700";
    case "scheduled":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function TeacherAssignmentTab({ classId }: { classId: string }) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>(INITIAL_ASSIGNMENTS);
  const [activeFilter, setActiveFilter] = useState<"all" | "published" | "drafts">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const handleCreateAssignment = () => {
    navigate(`/class/${classId}/assignment/create`);
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (activeFilter === "published") return assignment.status === "published";
    if (activeFilter === "drafts") return assignment.status === "draft";
    return true;
  });

  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssignments = filteredAssignments.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Show assignments list view
  return (
    <div className="p-8 mx-auto max-w-7xl">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Assignment</h1>
          <p className="mt-2 text-slate-600">
            Create, monitor, and grade your student assignments in one place.
          </p>
        </div>
        <button 
          onClick={handleCreateAssignment}
          className="flex items-center gap-2 px-4 py-2 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Create New Assignment
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-8 mb-6 border-b border-slate-200">
        {[
          { id: "all", label: "All Assignments" },
          { id: "published", label: "Published" },
          { id: "drafts", label: "Drafts" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveFilter(tab.id as "all" | "published" | "drafts");
              setCurrentPage(1);
            }}
            className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
              activeFilter === tab.id
                ? "text-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
            {activeFilter === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {/* Assignments Table */}
      <div className="mb-8 overflow-hidden bg-white border rounded-lg border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-xs font-semibold text-left uppercase text-slate-600">
                  Assignment Title
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-left uppercase text-slate-600">
                  Academic Session
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-left uppercase text-slate-600">
                  Due Date
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-left uppercase text-slate-600">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-left uppercase text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedAssignments.map((assignment) => (
                <tr
                  key={assignment.id}
                  className="transition-colors border-b border-slate-200 hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        {assignment.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {assignment.submissionType === "group" ? "Group" : "Individual"} • {assignment.submissionType === "individual" ? "Quiz" : "Project"}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {assignment.session}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    <p>{assignment.dueDate}</p>
                    <p className="text-sm text-slate-500">• {assignment.dueTime}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        assignment.status
                      )}`}
                    >
                      • {getStatusLabel(assignment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button className="p-2 transition-colors rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900" title="Edit assignment">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 transition-colors rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900" title="View assignment">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="p-2 transition-colors rounded-lg hover:bg-red-50 text-slate-600 hover:text-red-600" 
                        title="Delete assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 text-sm border-t border-slate-200 text-slate-600">
          <p>
            Showing {startIndex + 1} of {filteredAssignments.length} assignments
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-6">
        {STATISTICS.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="p-6 text-center bg-white border rounded-lg border-slate-200"
            >
              <div className="flex justify-center mb-3">
                <IconComponent className="w-8 h-8 text-slate-600" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              <div className="mt-2 text-sm font-medium tracking-wide uppercase text-slate-600">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
