"use client";

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";
import ClassGrid from "@/features/dashboard/components/ClassGrid";
import TermFilters from "@/features/dashboard/components/TermFilters";
import JoinClassModal from "@/features/dashboard/components/JoinClassModal";
import DeleteConfirmModal from "@/features/dashboard/components/DeleteConfirmModal";
import { useDashboardFilters } from "@/hooks";

export default function DashboardClient() {
  const navigate = useNavigate();
  const classList: any[] = []; // Mock data

  const { activeTerm, setActiveTerm, filteredClasses } =
    useDashboardFilters(classList);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    classId: string | null;
    className: string;
  }>({ isOpen: false, classId: null, className: "" });

  const handleOpen = useCallback(
    (id: string) => navigate(`/class/${id}`),
    [],
  );

  // const handleJoinClass = useCallback(
  //   (code: string) => {
  //     const found = findByJoinCode(code);
  //     if (found) {
  //       alert(`Joined class: ${found.name}`);
  //     } else {
  //       alert("Invalid class code");
  //     }
  //     setIsJoinModalOpen(false);
  //   },
  //   [],
  // );

  // const handleDeleteClick = useCallback(
  //   (id: string) => {
  //     const classToDelete = classList.find((c: any) => c.id.toString() === id);
  //     if (classToDelete) {
  //       setDeleteModalState({
  //         isOpen: true,
  //         classId: id,
  //         className: classToDelete.name,
  //       });
  //     }
  //   },
  //   [classList],
  // );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModalState.classId) return;
    try {
      // await removeClass(deleteModalState.classId);
      setDeleteModalState({ isOpen: false, classId: null, className: "" });
    } catch (err) {
      alert("Error deleting class: " + (err instanceof Error ? err.message : err));
    }
  }, [deleteModalState.classId]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteModalState({ isOpen: false, classId: null, className: "" });
  }, []);

  return (
    <>
      <DashboardHeader
        activeTerm={activeTerm}
        onChangeTerm={setActiveTerm}
        onJoinClass={() => setIsJoinModalOpen(true)}
      />

      <main className="px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Classes</h2>
            <p className="text-sm text-slate-500">
              Browse and manage your cohorts
            </p>
          </div>
          <TermFilters activeTerm={activeTerm} onChange={setActiveTerm} />
        </div>

        <div className="grid gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-3">
          <ClassGrid items={filteredClasses} onOpen={handleOpen}/>
        </div>
      </main>

      <JoinClassModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onJoin={() => { }}
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
