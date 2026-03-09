import path from "path";
import AdmZip from "adm-zip";

export interface ExtractedFile {
    name: string;
    path: string;
    content: string;
    size: number;
    type: "file";
}

const UPLOADS_ROOT = path.join(process.cwd(), "public");
const MAX_EXTRACTED_FILES = 1000;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB total

export function extractZip(filePath: string): ExtractedFile[] {
    // Validate the path stays within the public directory (prevent path traversal)
    const normalizedPath = path.normalize(filePath);
    if (normalizedPath.includes("..")) {
        throw new Error("Invalid file path");
    }

    const fullPath = path.join(UPLOADS_ROOT, normalizedPath);
    const resolvedPath = path.resolve(fullPath);
    if (!resolvedPath.startsWith(UPLOADS_ROOT)) {
        throw new Error("Invalid file path");
    }

    const zip = new AdmZip(resolvedPath);
    const entries = zip.getEntries();

    if (entries.length > MAX_EXTRACTED_FILES) {
        throw new Error(`Too many files in archive (max ${MAX_EXTRACTED_FILES})`);
    }

    const files: ExtractedFile[] = [];
    let totalSize = 0;

    for (const entry of entries) {
        if (!entry.isDirectory) {
            if (entry.header.size > MAX_FILE_SIZE) {
                throw new Error(`File ${entry.entryName} exceeds size limit`);
            }

            totalSize += entry.header.size;
            if (totalSize > MAX_TOTAL_SIZE) {
                throw new Error("Total extracted size exceeds limit");
            }

            files.push({
                name: entry.entryName,
                path: entry.entryName,
                content: entry.getData().toString("utf8"),
                size: entry.header.size,
                type: "file",
            });
        }
    }

    return files;
}
