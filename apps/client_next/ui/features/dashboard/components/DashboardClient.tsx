"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/ui/features/dashboard/components/DashboardHeader";
import ClassGrid from "@/ui/features/dashboard/components/ClassGrid";
import TermFilters from "@/ui/features/dashboard/components/TermFilters";
import JoinClassModal from "@/ui/features/dashboard/components/JoinClassModal";
import DeleteConfirmModal from "@/ui/features/dashboard/components/DeleteConfirmModal";
import { useClasses, useDashboardFilters } from "@/ui/hooks";

export default function DashboardClient() {
  const router = useRouter();
  const { classList, removeClass, findByJoinCode } = useClasses();

  const { activeTerm, setActiveTerm, filteredClasses } =
    useDashboardFilters(classList);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    classId: string | null;
    className: string;
  }>({ isOpen: false, classId: null, className: "" });

  const handleOpen = useCallback(
    (id: string) => router.push(`/class/${id}`),
    [router],
  );

  const handleJoinClass = useCallback(
    (code: string) => {
      const found = findByJoinCode(code);
      if (found) {
        alert(`Joined class: ${found.name}`);
      } else {
        alert("Invalid class code");
      }
      setIsJoinModalOpen(false);
    },
    [findByJoinCode],
  );

  const handleDeleteClick = useCallback(
    (id: string) => {
      const classToDelete = classList.find((c) => c.id.toString() === id);
      if (classToDelete) {
        setDeleteModalState({
          isOpen: true,
          classId: id,
          className: classToDelete.name,
        });
      }
    },
    [classList],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteModalState.classId) return;
    try {
      await removeClass(deleteModalState.classId);
      setDeleteModalState({ isOpen: false, classId: null, className: "" });
    } catch (err) {
      alert("Error deleting class: " + (err instanceof Error ? err.message : err));
    }
  }, [deleteModalState.classId, removeClass]);

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
          <ClassGrid items={filteredClasses} onOpen={handleOpen} onDelete={handleDeleteClick} />
        </div>
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
