"use client";

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";
import ClassGrid from "@/features/dashboard/components/ClassGrid";
import ClassesDetail from "@/features/dashboard/components/ClassesDetail";
import StatusFilters from "@/features/dashboard/components/TermFilters";
import JoinClassModal from "@/features/dashboard/components/JoinClassModal";
import DeleteConfirmModal from "@/features/dashboard/components/DeleteConfirmModal";
import { useDashboardFilters } from "@/hooks";
import { useAuth } from "@/context/AuthContext";
import classService from "@/services/classService";
import type { ClassCard } from "@/types/classCard";

export default function DashboardClient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isViewingClasses, setIsViewingClasses] = useState(false);
  const [classList, setClassList] = useState<ClassCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeClassId, setActiveClassId] = useState<string | number | null>(null);

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        const classes = await classService.getMyClasses();
        // Map API response to ClassCard format
        const mappedClasses: ClassCard[] = classes.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          coverImageUrl: c.coverImageUrl,
          joinCode: c.joinCode,
          status: c.status,
          owner: c.owner,
          role: c.role,
          createdAt: c.createdAt?.toString(),
        }));
        setClassList(mappedClasses);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch classes');
        setClassList([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const { activeStatus, setActiveStatus, filteredClasses } =
    useDashboardFilters(classList);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    classId: string | null;
    className: string;
  }>({ isOpen: false, classId: null, className: "" });

  const handleOpen = useCallback(
    (id: string, role?: string) => {
      setActiveClassId(id);
      navigate(`/class/${id}`, { state: { role } });
    },
    [navigate],
  );

  const handleJoinClass = useCallback(
    async (code: string) => {
      try {
        const result = await classService.joinClassByCode({ joinCode: code });
        alert(`Successfully joined class: ${result.className}`);
        // Refresh class list
        const classes = await classService.getMyClasses();
        const mappedClasses: ClassCard[] = classes.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          coverImageUrl: c.coverImageUrl,
          joinCode: c.joinCode,
          status: c.status,
          owner: c.owner,
          role: c.role,
          createdAt: c.createdAt?.toString(),
        }));
        setClassList(mappedClasses);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to join class");
      }
      setIsJoinModalOpen(false);
    },
    [],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModalState.classId) return;
    try {
      await classService.deleteClass(parseInt(deleteModalState.classId));
      setClassList(prev => prev.filter(c => c.id.toString() !== deleteModalState.classId));
      setDeleteModalState({ isOpen: false, classId: null, className: "" });
      alert("Class deleted successfully");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete class";
      
      if (errorMsg.includes("dependencies") || errorMsg.includes("existing")) {
        alert(`Cannot delete class: ${errorMsg}\n\nPlease ensure all assignments, submissions, and enrollments have been removed first.`);
      } else {
        alert("Error deleting class: " + errorMsg);
      }
    }
  }, [deleteModalState.classId]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteModalState({ isOpen: false, classId: null, className: "" });
  }, []);

  const handleEdit = useCallback((id: string) => {
    navigate(`/class/${id}/edit`);
  }, [navigate]);

  const handleLeaveClass = useCallback(async (id: string) => {
    try {
      const classItem = classList.find(c => c.id.toString() === id);
      if (confirm(`Are you sure you want to leave "${classItem?.name}"?`)) {
        const userId = user?.id || 0;
        await classService.removeMember(parseInt(id), userId);
        setClassList(prev => prev.filter(c => c.id.toString() !== id));
        alert("Successfully left the class");
      }
    } catch (err) {
      alert("Error leaving class: " + (err instanceof Error ? err.message : err));
    }
  }, [classList, user?.id]);

  const handleDeleteClass = useCallback((id: string) => {
    const classItem = classList.find(c => c.id.toString() === id);
    setDeleteModalState({
      isOpen: true,
      classId: id,
      className: classItem?.name || "",
    });
  }, [classList]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 border-4 rounded-full animate-spin border-primary-500 border-t-transparent"></div>
          <p className="text-slate-500">Loading classes...</p>
        </div>
      </div>
    );
  }

  // Show Classes detail view if viewing classes
  if (isViewingClasses) {
    return <ClassesDetail onBack={() => setIsViewingClasses(false)} />;
  }

  return (
    <>
      <DashboardHeader
        activeStatus={activeStatus}
        onChangeStatus={setActiveStatus}
        onJoinClass={() => setIsJoinModalOpen(true)}
      />

      <main className="px-6 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Classes</h2>
            <p className="text-sm text-slate-500">
              Browse and manage your cohorts
            </p>
          </div>
          <StatusFilters activeStatus={activeStatus} onChange={setActiveStatus} />
        </div>

        {error && (
          <div className="p-4 mt-4 text-red-700 border border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        <div className="grid gap-6 mt-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <ClassGrid 
            items={filteredClasses} 
            onOpen={(id) => {
              const classItem = filteredClasses.find(c => c.id.toString() === id);
              handleOpen(id, classItem?.role);
            }}
            activeClassId={activeClassId}
            onEdit={handleEdit}
            onLeaveClass={handleLeaveClass}
            onDeleteClass={handleDeleteClass}
          />
        </div>

        {!error && filteredClasses.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-500">No classes found. Join or create a class to get started.</p>
          </div>
        )}
      </main>

      <JoinClassModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={handleJoinClass}
      />

      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        className={deleteModalState.className}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
