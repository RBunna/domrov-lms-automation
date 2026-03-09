"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CardFooterActions from "@/ui/design-system/primitives/CardFooterActions";
import CardHeaderGradient from "@/ui/design-system/primitives/CardHeaderGradient";
import type { ClassCard as ClassCardType } from "@/types/classCard";

interface ClassCardProps {
  classItem: ClassCardType;
  onOpen?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * ClassCard - Displays a class with gradient header, term, and actions.
 * Uses card-surface styling for consistent card appearance.
 */
export default function ClassCard({ classItem, onOpen, onDelete }: ClassCardProps) {
  // Modern, attractive, professional card design
  return (
    <article
      className="relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-slate-200 overflow-hidden flex flex-col min-h-45"
      style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 50%)' }}
    >
      {/* Gradient header with avatar initials */}
      <div className="flex items-center gap-4 px-5 py-4 bg-linear-to-r from-blue-500 via-purple-500 to-indigo-500 text-white rounded-t-2xl">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 text-white text-xl font-bold shadow-md">
          {classItem.name && classItem.name.length > 0
            ? classItem.name
              .split(' ')
              .map(w => w[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
            : 'CL'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold truncate drop-shadow-sm">{classItem.name}</h3>
        </div>
      </div>
      {/* Card content */}
      <div className="flex-1 flex flex-col justify-between px-5 py-4">
        <p className="text-slate-700 text-sm mb-2 line-clamp-3">{classItem.description}</p>
        <div className="mt-auto flex justify-end">
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition-colors text-sm"
            onClick={onOpen ? () => onOpen(classItem.id?.toString?.() ?? '') : undefined}
            aria-label="View class details"
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  );
}
