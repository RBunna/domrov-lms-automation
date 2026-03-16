import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit2, Eye, Trash2 } from "lucide-react";
import { useAssignments } from "@/context/AssignmentContext";
import ViewAssignmentDetail from "@/features/assignment/components/ViewAssignmentDetail";
import { mockAssignmentDetails } from "@/data/mockAssignmentDetails";



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
  const { assignments, deleteAssignment } = useAssignments();
  const [activeFilter, setActiveFilter] = useState<"all" | "published" | "drafts">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const itemsPerPage = 4;

  const handleCreateAssignment = () => {
    navigate(`/class/${classId}/assignment/create`);
  };

  const handleEditAssignment = (assignmentId: string) => {
    navigate(`/class/${classId}/assignment/${assignmentId}/edit`);
  };

  const handleViewAssignment = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      deleteAssignment(assignmentId);
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

  // Show assignment detail view when one is selected
  if (selectedAssignmentId) {
    return (
      <div className="p-8 mx-auto max-w-7xl">
        <ViewAssignmentDetail
          data={mockAssignmentDetails}
          onBack={() => setSelectedAssignmentId(null)}
        />
      </div>
    );
  }

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
                        assignment.status || "draft"
                      )}`}
                    >
                      • {getStatusLabel(assignment.status || "draft")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleEditAssignment(assignment.id || "")}
                        className="p-2 transition-colors rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900" 
                        title="Edit assignment"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleViewAssignment(assignment.id || "")}
                        className="p-2 transition-colors rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900" 
                        title="View assignment"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteAssignment(assignment.id || "")}
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


    </div>
  );
}
