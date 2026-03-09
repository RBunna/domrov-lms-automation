import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import type { SubmissionRecord } from "@/types/submissionRecord";

const SUBMISSIONS_PATH = path.join(process.cwd(), "data", "submissions.json");
const IDE_MOCK_PATH = path.join(process.cwd(), "data", "ideMock.json");

export async function readAllSubmissions(): Promise<SubmissionRecord[]> {
    try {
        const data = await readFile(SUBMISSIONS_PATH, "utf-8");
        const parsed = JSON.parse(data);
        // Handle both array format and { submissions: [...] } format
        if (Array.isArray(parsed)) return parsed;
        if (parsed?.submissions && Array.isArray(parsed.submissions)) return parsed.submissions;
        return [];
    } catch {
        return [];
    }
}

export async function writeAllSubmissions(submissions: SubmissionRecord[]): Promise<void> {
    const dir = path.dirname(SUBMISSIONS_PATH);
    if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
    }
    await writeFile(SUBMISSIONS_PATH, JSON.stringify(submissions, null, 2));
}

export async function readIdeMockData(): Promise<{ submissions: SubmissionRecord[] }> {
    try {
        const data = await readFile(IDE_MOCK_PATH, "utf-8");
        return JSON.parse(data);
    } catch {
        return { submissions: [] };
    }
}

export async function writeIdeMockData(data: { submissions: SubmissionRecord[] }): Promise<void> {
    const dir = path.dirname(IDE_MOCK_PATH);
    if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
    }
    await writeFile(IDE_MOCK_PATH, JSON.stringify(data, null, 2));
}

export function getUploadDir(assignmentId: string): string {
    return path.join(process.cwd(), "public", "uploads", assignmentId);
}

export async function ensureUploadDir(assignmentId: string): Promise<string> {
    const uploadDir = getUploadDir(assignmentId);
    if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
    }
    return uploadDir;
}

export async function saveUploadedFile(
    buffer: Buffer,
    assignmentId: string,
    fileName: string,
): Promise<string> {
    const uploadDir = await ensureUploadDir(assignmentId);
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    return `/uploads/${assignmentId}/${fileName}`;
}
