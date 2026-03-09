// Next.js API route for GitHub OAuth callback
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { code, state } = await req.json();
    if (!code) {
      return NextResponse.json({ message: "Missing authorization code" }, { status: 400 });
    }

    // Proxy to backend OAuth callback
    const domrovRes = await fetch(
      `https://api.domrov.app/auth/github/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const data = await domrovRes.json();
    if (!domrovRes.ok) {
      throw new Error(data.message || "OAuth callback failed");
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "OAuth callback failed" }, { status: 400 });
  }
}
