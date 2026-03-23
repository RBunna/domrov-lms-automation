import { useRef, useState, useEffect } from "react";
import { FileIcon, Upload, Loader2, Download, Trash2, ImageIcon, FileTextIcon, ArchiveIcon } from "lucide-react";
import fileService from "@/services/fileService";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  secureUrl: string;   // Cloudinary URL — used directly for download
  publicId: string;
  fileType: string;    // mime type
}

interface FilesTabProps {
  classId: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStorageKey(classId: string) {
  return `class_files_${classId}`;
}

function loadFilesFromStorage(classId: string): UploadedFile[] {
  try {
    const stored = localStorage.getItem(getStorageKey(classId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFilesToStorage(classId: string, files: UploadedFile[]) {
  try {
    localStorage.setItem(getStorageKey(classId), JSON.stringify(files));
  } catch {
    // ignore
  }
}

/**
 * Returns the correct Cloudinary upload endpoint based on file MIME type.
 * - image/* → /image/upload
 * - video/* → /video/upload
 * - everything else (pdf, docx, zip...) → /raw/upload
 */
function getCloudinaryResourceType(mimeType: string): "image" | "video" | "raw" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw";
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/"))
    return <ImageIcon className="w-5 h-5 text-blue-500" />;
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return <FileTextIcon className="w-5 h-5 text-red-500" />;
  if (mimeType.includes("zip") || mimeType.includes("archive"))
    return <ArchiveIcon className="w-5 h-5 text-amber-500" />;
  return <FileIcon className="w-5 h-5 text-slate-500" />;
}

export default function FilesTab({ classId }: FilesTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>(() =>
    loadFilesFromStorage(classId)
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    saveFilesToStorage(classId, files);
  }, [files, classId]);

  useEffect(() => {
    setFiles(loadFilesFromStorage(classId));
  }, [classId]);

  function openFilePicker(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  // ── Upload via Cloudinary ─────────────────────────────────────────────────
  // Step 1: GET /file/cloudinary-presigned-url
  //         → { signature, timestamp, folder, public_id, cloud_name, api_key }
  //
  // Step 2: POST https://api.cloudinary.com/v1_1/{cloud_name}/{resourceType}/upload
  //         Uses /image, /video, or /raw based on file mime type
  //         → { secure_url, public_id, bytes, ... }
  //
  // Download: uses secure_url directly from Cloudinary CDN (no backend needed)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Step 1 — get Cloudinary presigned params
      const params = await fileService.getCloudinaryPresignedUrl();
      console.log("✅ Step 1 - Cloudinary params received");

      // Step 2 — upload using correct resource type endpoint
      const resourceType = getCloudinaryResourceType(file.type);
      console.log(`📤 Uploading as Cloudinary resourceType: ${resourceType}`);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", params.signature);
      formData.append("timestamp", params.timestamp.toString());
      formData.append("folder", params.folder);
      formData.append("public_id", params.public_id);
      formData.append("api_key", params.api_key);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${params.cloud_name}/${resourceType}/upload`;
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errBody = await uploadRes.text();
        throw new Error(`Cloudinary upload failed: ${uploadRes.status} — ${errBody}`);
      }

      const cloudinaryData = await uploadRes.json();
      console.log("✅ Step 2 - Cloudinary upload complete:", cloudinaryData.secure_url);

      const { secure_url, public_id, bytes } = cloudinaryData;

      // Add to list — secureUrl is used directly for download
      const newFile: UploadedFile = {
        id: public_id,
        name: file.name,
        size: formatBytes(bytes ?? file.size),
        uploadDate: formatDate(new Date()),
        secureUrl: secure_url,
        publicId: public_id,
        fileType: file.type,
      };

      setFiles((prev) => [newFile, ...prev]);
    } catch (err: any) {
      console.error("❌ Upload error:", err);
      setUploadError(err?.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Download directly from Cloudinary CDN ────────────────────────────────

  function handleDownload(e: React.MouseEvent, file: UploadedFile) {
    e.preventDefault();
    e.stopPropagation();
    setDownloadingId(file.id);

    // For raw files (PDF, DOCX etc), force download via fl_attachment
    const downloadUrl = file.secureUrl.includes("/raw/upload/")
      ? file.secureUrl.replace("/raw/upload/", "/raw/upload/fl_attachment/")
      : file.secureUrl;

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = file.name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log("✅ Download triggered:", downloadUrl);

    setTimeout(() => setDownloadingId(null), 1000);
  }

  function handleRemove(e: React.MouseEvent, fileId: string) {
    e.preventDefault();
    e.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-lg border border-slate-200 p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Class Files</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {files.length} file{files.length !== 1 ? "s" : ""} · Class {classId}
            </p>
          </div>
          <button
            type="button"
            onClick={openFilePicker}
            disabled={uploading}
            style={{ pointerEvents: "auto", cursor: uploading ? "not-allowed" : "pointer" }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</>
            ) : (
              <><Upload className="w-4 h-4" />Upload File</>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            onChange={handleFileChange}
            style={{ display: "none", position: "absolute", visibility: "hidden" }}
          />
        </div>

        {/* Error */}
        {uploadError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-600">{uploadError}</p>
            <button type="button" onClick={() => setUploadError(null)}
              className="text-red-400 hover:text-red-600 ml-4 text-lg leading-none">×</button>
          </div>
        )}

        {/* File list */}
        {files.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">
              Uploaded Files ({files.length})
            </h3>
            {files.map((file) => (
              <div key={file.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileTypeIcon mimeType={file.fileType} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{file.size} · {file.uploadDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button type="button"
                    onClick={(e) => handleDownload(e, file)}
                    disabled={downloadingId === file.id}
                    style={{ pointerEvents: "auto", cursor: "pointer" }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
                  >
                    {downloadingId === file.id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Download className="w-3 h-3" />}
                    Download
                  </button>
                  <button type="button"
                    onClick={(e) => handleRemove(e, file.id)}
                    style={{ pointerEvents: "auto", cursor: "pointer" }}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove from list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-lg">
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
              <Upload className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">No files uploaded yet</p>
            <p className="text-xs text-slate-400 mb-4">Upload any file — PDF, images, DOCX, ZIP, MP4</p>
            <button type="button"
              onClick={openFilePicker}
              disabled={uploading}
              style={{ pointerEvents: "auto", cursor: "pointer" }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Choose File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}