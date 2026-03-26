"use client";

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import StudentSubmissionsTable from "@/features/assignment/components/StudentSubmissionsTable";
import { getAssessmentDetails } from "@/services/assessmentService";
import { getSubmissionStats } from "@/services/submissionService";
import type { AssessmentDetailDto } from "@/types/assessment";
import type { AssessmentStatsResponseDto } from "@/types/submission";

interface ViewAssignmentPageProps {
  onBack?: () => void;
}

export default function ViewAssignmentPage({ onBack }: ViewAssignmentPageProps = {}) {
  const navigate = useNavigate();
  const params = useParams();
  const assignmentId = Number(params.assignmentId) || 0;

  const [assignment, setAssignment] = useState<AssessmentDetailDto | null>(null);
  const [stats, setStats] = useState<AssessmentStatsResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching assignment data for ID:", assignmentId);
        
        // Fetch assignment details
        const assignmentData = await getAssessmentDetails(assignmentId);
        setAssignment(assignmentData);
        
        // Fetch stats
        const statsData = await getSubmissionStats(assignmentId);
        setStats(statsData?.data || null);
        
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err?.message || "Failed to load assignment";
        setError(errorMsg);
        console.error("Error fetching assignment:", err);
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId > 0) {
      fetchData();
    }
  }, [assignmentId]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-6 py-6 mx-auto max-w-7xl">
          <div className="flex items-start justify-between mb-6">
            <button
              onClick={() => onBack ? onBack() : navigate(-1)}
              className="flex items-center gap-2 mb-4 transition-colors text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>

          {loading ? (
            <div className="text-slate-600">Loading assignment...</div>
          ) : error ? (
            <div className="text-red-600">Error: {error}</div>
          ) : assignment ? (
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="mb-2 text-3xl font-bold text-slate-900">
                  {assignment.title}
                </h1>
                <p className="text-slate-600">
                  {assignment.instruction}
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block px-4 py-2 border border-blue-200 rounded-lg bg-blue-50">
                  <p className="text-xs font-medium text-blue-600">DUE DATE</p>
                  <p className="text-lg font-bold text-blue-700">
                    {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8 mx-auto max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          {/* Total Submissions */}
          <div className="p-6 transition-shadow bg-white border rounded-lg shadow-sm border-slate-200 hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="mb-1 text-sm font-medium text-slate-600">Total Submissions</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.totalSubmissions || 0}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a9 9 0 0118 0v2h2v-2a11 11 0 00-22 0v2h2v-2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Graded Submissions */}
          <div className="p-6 transition-shadow bg-white border rounded-lg shadow-sm border-slate-200 hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="mb-1 text-sm font-medium text-slate-600">Graded</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.gradedSubmissions || 0}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="p-6 transition-shadow bg-white border rounded-lg shadow-sm border-slate-200 hover:shadow-md">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="mb-1 text-sm font-medium text-slate-600">Pending</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.pendingSubmissions || 0}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Student Submissions Table */}
        <div className="p-6 bg-white border rounded-lg shadow-sm border-slate-200">
          <StudentSubmissionsTable assignmentId={assignmentId} />
        </div>
      </div>
    </div>
  );
}
