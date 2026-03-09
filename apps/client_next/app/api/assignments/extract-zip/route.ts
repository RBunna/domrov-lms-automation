import { NextRequest, NextResponse } from "next/server";
import { extractZip } from "@/domains/submissions/zipExtractor";

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json();

    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json(
        { success: false, message: "File path is required and must be a string" },
        { status: 400 }
      );
    }

    // Block suspicious patterns
    if (filePath.includes("..") || filePath.includes("\0")) {
      return NextResponse.json(
        { success: false, message: "Invalid file path" },
        { status: 400 }
      );
    }

    const files = extractZip(filePath);

    return NextResponse.json({
      success: true,
      files,
    });

  } catch (error) {
    console.error("ZIP extraction error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to extract ZIP file" },
      { status: 500 }
    );
  }
}
