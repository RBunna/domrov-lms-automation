"use client";

interface PostsTabProps {
  classId: string;
}

/**
 * PostsTab - Posts/announcements view for the class.
 */
export default function PostsTab({ classId: _classId }: PostsTabProps) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Class Posts</h2>
        
        {/* Create Post */}
        <div className="mb-6">
          <textarea
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Share an announcement with your class..."
          />
          <div className="flex justify-end mt-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Post
            </button>
          </div>
        </div>

        {/* Sample Post */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold">
              T
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-slate-900">Teacher</h4>
                <span className="text-xs text-slate-500">2 hours ago</span>
              </div>
              <p className="text-slate-700 text-sm">
                Welcome to the class! Make sure to check the assignments section regularly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
