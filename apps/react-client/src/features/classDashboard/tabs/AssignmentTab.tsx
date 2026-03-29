// AssignmentTab.tsx
import { useState } from "react";
import AssignmentFilters from "../AssignmentFilters";
import AssignmentList from "../AssignmentList";
import StudentAssignmentDetail from "@/pages/StudentAssignmentDetail";

interface AssignmentTabProps {
  classId: string;
}

export default function AssignmentTab({ classId }: AssignmentTabProps) {
  const [activeFilter, setActiveFilter] = useState<
    "upcoming" | "past-due" | "completed"
  >("upcoming");

  // State to track if an assignment is currently being viewed
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<
    string | null
  >(null);

  // If an assignment is selected, render the Detail View instead of the list
  if (selectedAssignmentId) {
    return (
      <StudentAssignmentDetail
        classId={classId}
        assignmentId={selectedAssignmentId}
        onBack={() => setSelectedAssignmentId(null)}
      />
    );
  }

  // Otherwise, render the standard tab with filters and lists
  return (
    <div className="max-w-6xl p-6 mx-auto animate-fadeIn">
      {/* Assignment Filters */}
      <AssignmentFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Assignment List */}
      <div className="mt-6">
        <AssignmentList
          classId={classId}
          filter={activeFilter}
          onSelectAssignment={setSelectedAssignmentId} // Pass down the selection handler
        />
      </div>
    </div>
  );
}
