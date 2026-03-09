"use client";

import { useState } from "react";
import AssignmentList from "../AssignmentList";
import AssignmentFilters from "../AssignmentFilters";

interface AssignmentTabProps {
  classId: string;
}

/**
 * AssignmentTab - Main assignment view with filters and list.
 * Displays upcoming, past due, and completed assignments.
 */
export default function AssignmentTab({ classId }: AssignmentTabProps) {
  const [activeFilter, setActiveFilter] = useState<"upcoming" | "past-due" | "completed">("upcoming");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Assignment Filters */}
      <AssignmentFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {/* Assignment List */}
      <div className="mt-6">
        <AssignmentList classId={classId} filter={activeFilter} />
      </div>
    </div>
  );
}
