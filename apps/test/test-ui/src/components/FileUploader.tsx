import React, { useState } from "react";

export interface FileUploaderProps {
  /** URL of your backend endpoint that returns presigned URL */
  presignedUrlEndpoint: string;
  /** Optional callback after successful upload */
  onUploadSuccess?: (key: string) => void;
  /** Optional callback on error */
  onUploadError?: (error: string) => void;
}

interface PresignedResponse {
  uploadUrl: string;
  key: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  presignedUrlEndpoint,
  onUploadSuccess,
  onUploadError,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedKey, setUploadedKey] = useState("");
  const [error, setError] = useState("");

  // Fetch presigned URL from backend
  const getPresignedUrl = async (file: File): Promise<PresignedResponse> => {
    const params = new URLSearchParams({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    });

    const res = await fetch(`${presignedUrlEndpoint}?${params.toString()}`);
    if (!res.ok) {
      throw new Error("Failed to get presigned URL");
    }
    return res.json();
  };

  // Upload to R2 using raw PUT
  const uploadFileToR2 = (file: File, uploadUrl: string) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));

      xhr.setRequestHeader(
        "Content-Type",
        file.type || "application/octet-stream",
      );
      xhr.send(file);
    });

  // Handle file upload
  const handleUpload = async () => {
    try {
      setError("");
      setUploading(true);
      setProgress(0);
      setUploadedKey("");

      if (!file) throw new Error("Please select a file");

      const { uploadUrl, key } = await getPresignedUrl(file);
      await uploadFileToR2(file, uploadUrl);

      setUploadedKey(key);
      onUploadSuccess?.(key);
    } catch (err: any) {
      setError(err.message || "Upload failed");
      onUploadError?.(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const selected = e.target.files?.[0] || null;
          setFile(selected);
          setProgress(0);
          setUploadedKey("");
          setError("");
        }}
      />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {uploading && <p>Progress: {progress}%</p>}
      {uploadedKey && <p>Uploaded successfully: {uploadedKey}</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
    </div>
  );
};
