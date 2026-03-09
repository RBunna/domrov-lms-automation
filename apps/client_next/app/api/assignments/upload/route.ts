import { NextRequest, NextResponse } from "next/server";
import {
    getSubmissions,
    createFileSubmission,
    createLinkSubmission,
} from "@/domains/submissions/submissions.service";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB per file
const ALLOWED_UPLOAD_TYPES = ["file", "link"];

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const uploadType = formData.get("uploadType") as string;
        const assignmentId = formData.get("assignmentId") as string;
        const userId = formData.get("userId") as string;

        if (!assignmentId || !userId) {
            return NextResponse.json(
                { success: false, message: "Missing assignment or user ID" },
                { status: 400 },
            );
        }

        if (!uploadType || !ALLOWED_UPLOAD_TYPES.includes(uploadType)) {
            return NextResponse.json(
                { success: false, message: "Invalid upload type" },
                { status: 400 },
            );
        }

        let submission;

        if (uploadType === "file") {
            const files = formData.getAll("files") as File[];
            if (!files || files.length === 0) {
                return NextResponse.json(
                    { success: false, message: "No files provided" },
                    { status: 400 },
                );
            }

            // Validate file sizes
            for (const file of files) {
                if (file.size > MAX_FILE_SIZE) {
                    return NextResponse.json(
                        { success: false, message: `File ${file.name} exceeds maximum size of 100MB` },
                        { status: 413 },
                    );
                }
            }

            submission = await createFileSubmission(assignmentId, userId, files);
        } else if (uploadType === "link") {
            const links = formData.getAll("links") as string[];
            if (!links || links.length === 0) {
                return NextResponse.json(
                    { success: false, message: "No links provided" },
                    { status: 400 },
                );
            }
            submission = await createLinkSubmission(assignmentId, userId, links);
        }

        return NextResponse.json({
            success: true,
            message: "Submission uploaded successfully",
            data: submission,
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { success: false, message: "Upload failed" },
            { status: 500 },
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get("assignmentId") ?? undefined;
        const userId = searchParams.get("userId") ?? undefined;

        const data = await getSubmissions(assignmentId, userId);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Fetch error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch submissions" },
            { status: 500 },
        );
    }
}
