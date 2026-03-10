"use client";

import { useState } from "react";
import type { ClassCard as ClassCardType } from "@/types/classCard";

interface ClassCardProps {
  classItem: ClassCardType;
  onOpen?: (id: string) => void;
}

/**
 * ClassCard - Displays a class with clean, simple design showing all backend data.
 */
export default function ClassCard({ classItem, onOpen }: ClassCardProps) {
  const [copied, setCopied] = useState(false);

  const ownerName = classItem.owner
    ? `${classItem.owner.firstName} ${classItem.owner.lastName}`
    : "Unknown";

  const statusColor =
    classItem.status === "ACTIVE"
      ? "bg-green-100 text-green-700"
      : classItem.status === "END"
        ? "bg-gray-100 text-gray-600"
        : "bg-yellow-100 text-yellow-700";

  const roleColor =
    classItem.role === "Teacher"
      ? "bg-blue-100 text-blue-700"
      : "bg-purple-100 text-purple-700";

  const handleCopyCode = async () => {
    if (classItem.joinCode) {
      try {
        await navigator.clipboard.writeText(classItem.joinCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = classItem.joinCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col h-[340px]">
      {/* Cover Image or Placeholder */}
      {classItem.coverImageUrl ? (
        <img
          src={classItem.coverImageUrl}
          alt={classItem.name}
          className="w-full h-28 object-cover shrink-0"
        />
      ) : (
        <div className="w-full h-28 bg-slate-100 flex items-center justify-center shrink-0">
          <span className="text-4xl font-bold text-slate-300">
            {classItem.name
              ?.split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "CL"}
          </span>
        </div>
      )}

      {/* Card Content */}
      <div className="flex-1 flex flex-col p-4 min-h-0">
        {/* Header: Name + Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-1 flex-1">
            {classItem.name}
          </h3>
          <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${statusColor}`}>
            {classItem.status}
          </span>
        </div>

        {/* Description */}
        <p className="text-slate-600 text-xs line-clamp-2 mb-2 h-8">
          {classItem.description || "No description"}
        </p>

        {/* Owner Info */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="truncate">{ownerName}</span>
        </div>

        {/* Role Badge */}
        <div className="my-2 h-5">
          {classItem.role && (
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${roleColor}`}>
              {classItem.role}
            </span>
          )}
        </div>

        {/* Join Code (only show for teachers) */}
        <div className="h-5 text-xs">
          {classItem.joinCode && classItem.role === "Teacher" && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Code:</span>
              <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono text-xs">
                {classItem.joinCode}
              </code>
              <button
                onClick={handleCopyCode}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
                title={copied ? "Copied!" : "Copy code"}
              >
                {copied ? (
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-2 border-t border-slate-100">
          <button
            className="w-full px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors text-sm"
            onClick={onOpen ? () => onOpen(classItem.id?.toString?.() ?? "") : undefined}
            aria-label="View class details"
          >
            View Class
          </button>
        </div>
      </div>
    </article>
  );
}
