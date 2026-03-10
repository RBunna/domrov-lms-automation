"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Trash } from "lucide-react";

export interface UploadedFile {
  name: string;
  size: string;
  uploadedAt: string;
  path?: string;
  type?: 'file' | 'link';
  url?: string;
}

interface UploadSectionProps {
  uploadedFiles: UploadedFile[];
  onFilesAdded: (files: UploadedFile[]) => void;
  onFileRemoved: (index: number) => void;
  assignmentId?: string;
  userId?: string;
  onUploadComplete?: (data: unknown) => void;
  onFileClick?: (file: UploadedFile) => void;
}

/**
 * UploadSection - Drag and drop file upload area with file list and link support
 */
export default function UploadSection({
  uploadedFiles,
  onFilesAdded,
  onFileRemoved,
  assignmentId = "default",
  userId = "1",
  onUploadComplete,
  onFileClick
}: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [linkInput, setLinkInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('uploadType', 'file');
      formData.append('assignmentId', assignmentId);
      formData.append('userId', userId);

      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/assignments/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        const newFiles = result.data.files.map((file: { name: string; size: number; path: string }) => ({
          name: file.name,
          size: formatFileSize(file.size),
          uploadedAt: "Just now",
          path: file.path,
          type: 'file' as const
        }));
        onFilesAdded(newFiles);
        onUploadComplete?.(result.data);
      } else {
        alert('Upload failed: ' + result.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddLink = async () => {
    if (!linkInput.trim()) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('uploadType', 'link');
      formData.append('assignmentId', assignmentId);
      formData.append('userId', userId);
      formData.append('links', linkInput);

      const response = await fetch('/api/assignments/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        const newLink: UploadedFile = {
          name: linkInput,
          size: 'Link',
          uploadedAt: "Just now",
          type: 'link',
          url: linkInput
        };
        onFilesAdded([newLink]);
        setLinkInput('');
        onUploadComplete?.(result.data);
      } else {
        alert('Link upload failed: ' + result.message);
      }
    } catch (error) {
      console.error('Link upload error:', error);
      alert('Link upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4">Upload Your Work</h3>

      {/* Upload Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setUploadMode('file')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${uploadMode === 'file'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          📁 Upload Files
        </button>
        <button
          onClick={() => setUploadMode('link')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${uploadMode === 'link'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
        >
          🔗 Add Link
        </button>
      </div>

      {/* File Upload Area */}
      {uploadMode === 'file' && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer mb-6
            ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }
          `}
          onClick={handleBrowseFiles}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-linear-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 mb-1">Drag and drop code files here</p>
              <p className="text-xs text-slate-500">or <span className="text-blue-600 font-medium underline">browse from computer</span></p>
            </div>
            <p className="text-xs text-slate-400 mt-2">SUPPORTED: .PY, .JS, .ZIP, .PDF, .DOCX</p>
            {isUploading && (
              <p className="text-sm text-blue-600 font-medium mt-2">Uploading...</p>
            )}
          </div>
        </div>
      )}

      {/* Link Input Area */}
      {uploadMode === 'link' && (
        <div className="border-2 border-slate-300 rounded-2xl p-6 mb-6">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-slate-700">
              GitHub Repository, Google Drive, or Other Link
            </label>
            <input
              type="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://github.com/username/repo or https://drive.google.com/..."
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isUploading}
            />
            <button
              onClick={handleAddLink}
              disabled={!linkInput.trim() || isUploading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
            >
              {isUploading ? 'Adding...' : 'Add Link'}
            </button>
            <p className="text-xs text-slate-500">
              Accepted: GitHub repos, Google Drive, Dropbox, OneDrive, or any public link
            </p>
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
            Your Work
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                onClick={() => file.type === 'file' && onFileClick?.(file)}
                className={`flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-all group ${file.type === 'file' ? 'cursor-pointer hover:bg-blue-50' : ''
                  }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${file.type === 'link' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                    {file.type === 'link' ? (
                      <span className="text-lg">🔗</span>
                    ) : (
                      <FileText className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {file.type === 'link' ? (
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {file.name}
                        </a>
                      ) : (
                        <>
                          {file.name}
                          <span className="ml-2 text-xs text-blue-600">Click to preview</span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{file.size} • Uploaded {file.uploadedAt}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileRemoved(index);
                  }}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
