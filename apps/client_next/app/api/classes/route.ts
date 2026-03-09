import { NextRequest, NextResponse } from "next/server";
import {
  getAllClasses,
  addClass,
  ValidationError,
} from "@/domains/classes/classes.service";
import type { CreateClassInput } from "@/domains/classes/classes.service";

export async function GET() {
  try {
    const data = getAllClasses();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[Classes API] GET error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch classes" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const input: CreateClassInput = await req.json();
    const { data, volatile: isVolatile } = addClass(input);
    return NextResponse.json({ success: true, persisted: !isVolatile, data });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: "Validation failed", fields: error.fields },
        { status: 400 },
      );
    }
    console.error("[Classes API] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 },
    );
  }
}
