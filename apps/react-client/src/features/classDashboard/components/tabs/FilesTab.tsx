import { useRef, useState } from "react";
import { FileIcon, Upload, Loader2, Download } from "lucide-react";
import fileService from "@/services/fileService";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  secureUrl: string;  // Cloudinary secure_url for direct download
  publicId: string;
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

export default function FilesTab({ classId }: FilesTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ─── Open file picker ─────────────────────────────────────────────────────

  function openFilePicker(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  // ─── Upload flow ──────────────────────────────────────────────────────────
  // Step 1: GET /file/cloudinary-presigned-url
  //         → { signature, timestamp, folder, public_id, cloud_name, api_key }
  //
  // Step 2: POST https://api.cloudinary.com/v1_1/{cloud_name}/image/upload
  //         → { secure_url, public_id, asset_id, bytes, ... }
  //
  // Step 3: POST /file/notify-upload { key: public_id, filename }
  //         → registers upload in backend

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Step 1 — get Cloudinary presigned params
      const params = await fileService.getCloudinaryPresignedUrl();
      console.log("✅ Step 1 - Cloudinary params:", params);

      // Step 2 — upload to Cloudinary
      const cloudinaryRes = await fileService.uploadToCloudinary(file, params);
      console.log("✅ Step 2 - Cloudinary upload response:", cloudinaryRes);

      const { secure_url, public_id, bytes } = cloudinaryRes;

      // Step 3 — notify backend
      await fileService.notifyUpload({
        key: public_id,
        filename: file.name,
      });
      console.log("✅ Step 3 - Backend notified, public_id:", public_id);

      // Add to local file list
      setFiles((prev) => [
        {
          id: public_id,
          name: file.name,
          size: formatBytes(bytes),
          uploadDate: formatDate(new Date()),
          secureUrl: secure_url,
          publicId: public_id,
        },
        ...prev,
      ]);
    } catch (err: any) {
      console.error("❌ Upload error:", err);
      setUploadError(err?.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ─── Download — use Cloudinary secure_url directly ────────────────────────

  function handleDownload(e: React.MouseEvent, file: UploadedFile) {
    e.preventDefault();
    e.stopPropagation();
    // Open Cloudinary URL directly — no backend download endpoint needed
    const a = document.createElement("a");
    a.href = file.secureUrl;
    a.download = file.name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log("✅ Download triggered:", file.secureUrl);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-lg border border-slate-200 p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Class Files</h2>
            <p className="text-xs text-slate-500 mt-0.5">Class {classId}</p>
          </div>

          <button
            type="button"
            onClick={openFilePicker}
            disabled={uploading}
            style={{ pointerEvents: "auto", cursor: uploading ? "not-allowed" : "pointer" }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload File
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.docx,.zip,.mp4"
            onChange={handleFileChange}
            style={{ display: "none", position: "absolute", visibility: "hidden" }}
          />
        </div>

        {/* Error */}
        {uploadError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-600">{uploadError}</p>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="text-red-400 hover:text-red-600 ml-4 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* File list or empty state */}
        {files.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">
              Uploaded Files ({files.length})
            </h3>
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {file.size} · {file.uploadDate}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDownload(e, file)}
                  style={{ pointerEvents: "auto", cursor: "pointer" }}
                  className="flex items-center gap-1.5 ml-4 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors shrink-0"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-lg">
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
              <Upload className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              No files uploaded yet
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Upload files to share with your class
            </p>
            <button
              type="button"
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