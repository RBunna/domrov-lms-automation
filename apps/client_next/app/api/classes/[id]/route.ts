import { NextRequest, NextResponse } from "next/server";
import { removeClassById, NotFoundError } from "@/domains/classes/classes.service";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { ok: false, error: "Invalid class ID" },
        { status: 400 },
      );
    }

    const data = removeClassById(id);
    return NextResponse.json({ ok: true, message: "Class deleted successfully", data });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { ok: false, error: "Class not found" },
        { status: 404 },
      );
    }
    console.error("[Classes API] DELETE error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to delete class" },
      { status: 500 },
    );
  }
}
