import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const geminiKey = searchParams.get("gemini_key") ?? "";
  try {
    const resp = await fetch(`${BACKEND}/analyze/sample`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gemini_key: geminiKey }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: text }, { status: resp.status });
    }
    const data = await resp.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: `Backend unreachable: ${String(err)}` },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const geminiKey = (form.get("gemini_key") as string) ?? "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const upstream = new FormData();
    upstream.append("file", file);
    upstream.append("gemini_key", geminiKey);

    const resp = await fetch(`${BACKEND}/analyze/upload`, {
      method: "POST",
      body: upstream,
    });
    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: text }, { status: resp.status });
    }
    const data = await resp.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: `Backend unreachable: ${String(err)}` },
      { status: 502 }
    );
  }
}
