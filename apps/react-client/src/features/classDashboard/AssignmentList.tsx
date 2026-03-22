"use client";

import { useEffect, useState } from "react";
import AssignmentCard from "./AssignmentCard";
import { getAssessmentsByClass } from "@/services/assessmentService";
import assessmentService from "@/services/assessmentService";
import { useToast } from "@/components/Toast";

interface AssignmentListProps {
  classId: string;
  filter: "upcoming" | "past-due" | "completed" | "draft";
}

interface NormalizedAssignment {
  id: string;
  title: string;
  dueDate: string;
  dueTime: string;
  relativeDate: string;
  module: string;
  isPastDue: boolean;
  isDraft: boolean;
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

function formatDueDate(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "No due date";
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  const suffix =
    ["th", "st", "nd", "rd"][
      day % 10 <= 3 && ![11, 12, 13].includes(day % 100) ? day % 10 : 0
    ];
  const year = d.getFullYear();
  const thisYear = new Date().getFullYear();
  return year !== thisYear ? `${month} ${day}${suffix} ${year}` : `${month} ${day}${suffix}`;
}

function formatDueTime(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function getRelativeDate(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  const diffDays = Math.round((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    if (abs < 30) return `Due ${abs} day${abs === 1 ? "" : "s"} ago`;
    if (abs < 365) return `Due ${Math.round(abs / 30)} month${Math.round(abs / 30) === 1 ? "" : "s"} ago`;
    return "Due a year ago";
  }
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 6)
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()];
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssignmentList({ classId, filter }: AssignmentListProps) {
  const { showToast } = useToast();
  const [allAssignments, setAllAssignments] = useState<NormalizedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await getAssessmentsByClass(Number(classId));
      const raw = (response as any).data ?? [];

      console.log("🔍 Raw API assignments:", raw);

      const normalized: NormalizedAssignment[] = raw.map((item: any) => {
        const dateStr = String(item.dueDate ?? "");
        const due = new Date(dateStr);
        const now = new Date();

        // isDraft = isPublic is false (backend sets isPublic:true on publish)
        const isDraft = item.isPublic === false;

        return {
          id: String(item.id),
          title: item.title ?? "Untitled",
          dueDate: formatDueDate(dateStr),
          dueTime: formatDueTime(dateStr),
          relativeDate: getRelativeDate(dateStr),
          module: `Session ${item.session ?? ""}`,
          isPastDue: !isNaN(due.getTime()) && due < now && !isDraft,
          isDraft,
        };
      });

      setAllAssignments(normalized);
    } catch (err) {
      console.error("Failed to load assignments:", err);
      setError("Could not load assignments. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    load();
    return () => { cancelled = true; };
  }, [classId]);

  // ─── Publish a draft ──────────────────────────────────────────────────────

  const handlePublishDraft = async (assignmentId: string) => {
    setPublishingId(assignmentId);
    try {
      await assessmentService.publishAssessment(Number(assignmentId));
      showToast("✅ Assignment published!", "success", 3000);
      // Refresh the list
      await load();
    } catch (err) {
      console.error("Publish error:", err);
      showToast("❌ Failed to publish. Please try again.", "error", 3000);
    }
    setPublishingId(null);
  };

  // ─── Filter by tab ────────────────────────────────────────────────────────

  const assignments = allAssignments.filter((a) => {
    if (filter === "draft")     return a.isDraft;
    if (filter === "past-due" || filter === "completed")  return a.isPastDue && !a.isDraft;
    if (filter === "upcoming")  return !a.isDraft && !a.isPastDue;
    return false;
  });

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-20 bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-sm">{error}</p>
        <button
          className="mt-2 text-slate-600 text-sm underline"
          onClick={load}
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Empty ────────────────────────────────────────────────────────────────

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        {filter === "draft" && (
          <>
            <p className="text-sm">No drafts yet.</p>
            <p className="text-xs mt-1 text-slate-400">Assignments saved as draft will appear here.</p>
          </>
        )}
        {filter === "upcoming" && (
          <>
            <p className="text-sm">No upcoming assignments.</p>
            <p className="text-xs mt-1 text-slate-400">Published assignments with a future due date will appear here.</p>
          </>
        )}
        {filter === "past-due" && (
          <p className="text-sm">No past due assignments.</p>
        )}
      </div>
    );
  }

  // ─── List ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <div key={assignment.id} className="space-y-2">

          {/* Date row */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{assignment.dueDate}</h3>
            <span className="text-xs text-slate-500">
              {assignment.relativeDate}
              {assignment.dueTime && ` · ${assignment.dueTime}`}
            </span>

            {/* Badges */}
            {assignment.isDraft && (
              <span className="ml-auto text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Draft
              </span>
            )}
            {assignment.isPastDue && (
              <span className="ml-auto text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                Past due
              </span>
            )}
          </div>

          {/* Card */}
          <AssignmentCard assignment={assignment} />

          {/* Publish button — only shown in draft tab */}
          {filter === "draft" && (
            <div className="flex justify-end">
              <button
                onClick={() => handlePublishDraft(assignment.id)}
                disabled={publishingId === assignment.id}
                className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {publishingId === assignment.id ? "Publishing..." : "Publish"}
              </button>
            </div>
          )}

        </div>
      ))}
    </div>
  );
}