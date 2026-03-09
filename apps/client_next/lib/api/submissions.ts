import type { SubmissionRecord } from "@/types/submissionRecord";

export async function fetchSubmissions(
    assignmentId?: string,
    userId?: string,
): Promise<SubmissionRecord[]> {
    const params = new URLSearchParams();
    if (assignmentId) params.set("assignmentId", assignmentId);
    if (userId) params.set("userId", userId);

    const res = await fetch(`/api/assignments/upload?${params}`);
    const json = await res.json();
    if (json?.success && Array.isArray(json.data)) {
        return json.data;
    }
    throw new Error(json?.message ?? "Failed to fetch submissions");
}

export async function extractZipFile(
    filePath: string,
): Promise<{ name: string; path: string; content: string; size: number; type: string }[]> {
    const res = await fetch("/api/assignments/extract-zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
    });
    const json = await res.json();
    if (json?.success) {
        return json.files;
    }
    throw new Error(json?.message ?? "Failed to extract ZIP file");
}
