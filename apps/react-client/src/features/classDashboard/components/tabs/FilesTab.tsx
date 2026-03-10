import { FolderIcon, FileIcon } from "lucide-react";

interface FilesTabProps {
  classId: string;
}

/**
 * FilesTab - File management and sharing view.
 */
export default function FilesTab({ classId: _classId }: FilesTabProps) {
  const folders = [
    { id: "1", name: "Lecture Notes", fileCount: 12, type: "folder" },
    { id: "2", name: "Assignments", fileCount: 8, type: "folder" },
    { id: "3", name: "Resources", fileCount: 5, type: "folder" },
  ];

  const files = [
    { id: "1", name: "Syllabus.pdf", size: "245 KB", uploadDate: "Nov 1, 2024" },
    { id: "2", name: "Week1-Introduction.pdf", size: "1.2 MB", uploadDate: "Nov 5, 2024" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Class Files</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Upload File
          </button>
        </div>

        {/* Folders */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Folders</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FolderIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">{folder.name}</h4>
                    <p className="text-xs text-slate-500">{folder.fileCount} files</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Files */}
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Recent Files</h3>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                    <FileIcon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 text-sm">{file.name}</h4>
                    <p className="text-xs text-slate-500">
                      {file.size} • {file.uploadDate}
                    </p>
                  </div>
                </div>
                <button className="text-blue-600 text-sm font-medium hover:underline">
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
