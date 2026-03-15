import { ChevronLeft, Clipboard, Plus } from "lucide-react";

/**
 * AssignmentHeader - Top header for assignment page with navigation and search
 */
interface AssignmentHeaderProps {
  onBack?: () => void;
}

export default function AssignmentHeader({ onBack }: AssignmentHeaderProps) {

  return (
    <div className="px-8 py-4 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack || (() => window.history.back())}
            className="p-2 transition-colors rounded-lg hover:bg-slate-100"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600">
            <Clipboard className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Assignment</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search assignments..."
              className="px-4 py-2 text-sm border rounded-lg w-80 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="p-2 transition-colors rounded-lg hover:bg-slate-100">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button className="p-2 transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
