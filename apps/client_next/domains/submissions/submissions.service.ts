import {
    readAllSubmissions,
    writeAllSubmissions,
    readIdeMockData,
    writeIdeMockData,
    saveUploadedFile,
} from "@/domains/submissions/submissions.repository";
import type {
    SubmissionRecord,
    SubmissionFile,
    SubmissionLink,
} from "@/types/submissionRecord";

const CODE_EXTENSIONS = [".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c", ".dart"];

function isCodeFile(fileName: string): boolean {
    return CODE_EXTENSIONS.some((ext) => fileName.endsWith(ext));
}

export async function getSubmissions(
    assignmentId?: string,
    userId?: string,
): Promise<SubmissionRecord[]> {
    let submissions = await readAllSubmissions();
    if (assignmentId) {
        submissions = submissions.filter((s) => s.assignmentId === assignmentId);
    }
    if (userId) {
        submissions = submissions.filter((s) => s.userId === userId);
    }
    return submissions;
}

export async function createFileSubmission(
    assignmentId: string,
    userId: string,
    files: File[],
): Promise<SubmissionRecord> {
    const savedFiles: SubmissionFile[] = [];

    for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${userId}_${Date.now()}_${file.name}`;
        const uploadPath = await saveUploadedFile(buffer, assignmentId, fileName);

        savedFiles.push({
            name: file.name,
            size: file.size,
            path: uploadPath,
            uploadedAt: new Date().toISOString(),
        });
    }

    const submission: SubmissionRecord = {
        id: Date.now().toString(),
        assignmentId,
        userId,
        submittedAt: new Date().toISOString(),
        type: "file",
        files: savedFiles,
        links: [],
        codeFiles: savedFiles
            .filter((f) => isCodeFile(f.name))
            .map((f) => ({ ...f, type: "file" as const, content: "", feedback: {} })),
        status: "submitted",
        score: null,
        feedback: {},
    };

    await persistSubmission(submission);
    return submission;
}

export async function createLinkSubmission(
    assignmentId: string,
    userId: string,
    links: string[],
): Promise<SubmissionRecord> {
    const submissionLinks: SubmissionLink[] = links.map((url) => ({
        url,
        addedAt: new Date().toISOString(),
    }));

    const submission: SubmissionRecord = {
        id: Date.now().toString(),
        assignmentId,
        userId,
        submittedAt: new Date().toISOString(),
        type: "link",
        files: [],
        links: submissionLinks,
        codeFiles: [],
        status: "submitted",
        score: null,
        feedback: {},
    };

    await persistSubmission(submission);
    return submission;
}

async function persistSubmission(submission: SubmissionRecord): Promise<void> {
    // Save to submissions store
    const existing = await readAllSubmissions();
    existing.push(submission);
    await writeAllSubmissions(existing);

    // Save to IDE mock store
    const ideMockData = await readIdeMockData();
    ideMockData.submissions.push(submission);
    await writeIdeMockData(ideMockData);
}
