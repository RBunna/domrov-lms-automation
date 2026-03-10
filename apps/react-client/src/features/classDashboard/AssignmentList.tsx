"use client";

import AssignmentCard from "./AssignmentCard";
import { ClipboardIcon } from "./icons";

type FilterType = "upcoming" | "past-due" | "completed";

interface AssignmentListProps {
  classId: string;
  filter: FilterType;
}

// Mock assignment data
const mockAssignments = {
  upcoming: [
    {
      id: "1",
      title: "WB-CHALLENGE-Weather",
      dueDate: "Nov 18th",
      dueTime: "11:50 PM",
      relativeDate: "Tomorrow",
      module: "Module WB - List & Callbacks",
    },
    {
      id: "2",
      title: "WB-CHALLENGE-Weather",
      dueDate: "Nov 20th",
      dueTime: "11:50 PM",
      relativeDate: "Thursday",
      module: "Module WB - List & Callbacks",
    },
  ],
  "past-due": [
    {
      id: "3",
      title: "WB-CHALLENGE-Weather",
      dueDate: "June 23th 2024",
      dueTime: "11:50 PM",
      relativeDate: "Due a year ago",
      module: "Module WB - List & Callbacks",
    },
    {
      id: "4",
      title: "WB-CHALLENGE-Weather",
      dueDate: "Nov 14th 2024",
      dueTime: "11:50 PM",
      relativeDate: "Due a year ago",
      module: "Module WB - List & Callbacks",
    },
    {
      id: "5",
      title: "WB-CHALLENGE-Weather",
      dueDate: "Dec 18th 2024",
      dueTime: "11:50 PM",
      relativeDate: "Due a year ago",
      module: "Module WB - List & Callbacks",
    },
    {
      id: "6",
      title: "WB-CHALLENGE-Weather",
      dueDate: "Dec 24th 2024",
      dueTime: "11:59 PM",
      relativeDate: "Due a year ago",
      module: "Module WB - List & Callbacks",
    },
  ],
  completed: [
    {
      id: "7",
      title: "MID TERM EXAM",
      dueDate: "June 23th 2024",
      dueTime: "11:50 PM",
      relativeDate: "Thursday",
      module: "Module WB - List & Callbacks",
      status: "submitted" as const,
    },
    {
      id: "8",
      title: "S2 - PRACTICE- Flex Box",
      dueDate: "Nov 14th 2024",
      dueTime: "11:59 PM",
      relativeDate: "Friday",
      module: "Module WB - List & Callbacks",
      status: "submitted" as const,
      additionalStatus: "feedback" as const,
    },
    {
      id: "9",
      title: "S3 - PRACTICE- Flex Box - Real Cases",
      dueDate: "Dec 18th 2024",
      dueTime: "11:50 PM",
      relativeDate: "Sunday",
      module: "Module WB - List & Callbacks",
      status: "submitted" as const,
    },
    {
      id: "10",
      title: "S1 - LEARNING - Anatomy of HTML elements - TODO BEFORE",
      dueDate: "Dec 24th 2024",
      dueTime: "11:59 PM",
      relativeDate: "Saturday",
      module: "Module WB - List & Callbacks",
      status: "inactive" as const,
    },
  ],
};

/**
 * AssignmentList - Displays list of assignments based on filter.
 */
export default function AssignmentList({ classId: _classId, filter }: AssignmentListProps) {
  const assignments = mockAssignments[filter] || [];

  // Missed assignment alert
  const showMissedAlert = filter === "upcoming";

  return (
    <div className="space-y-6">
      {/* Missed Assignment Alert - Only for Upcoming */}
      {showMissedAlert && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0">
            <ClipboardIcon className="w-6 h-6 text-slate-900" />
          </div>
          <div className="flex-1">
            <p className="text-slate-900 font-semibold">
              You have missed the assignment
            </p>
            <button className="text-red-600 text-sm font-medium hover:underline mt-1">
              View Assignment
            </button>
          </div>
        </div>
      )}

      {/* Assignment Cards by Date */}
      {assignments.length > 0 ? (
        <>
          {assignments.map((assignment) => (
            <div key={assignment.id} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {assignment.dueDate}
                </h3>
                <span className="text-xs text-slate-500">{assignment.relativeDate}</span>
              </div>
              {/* Assignment Card */}
              <AssignmentCard assignment={assignment} />
            </div>
          ))}
        </>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <p>No {filter} assignments</p>
        </div>
      )}
    </div>
  );
}
