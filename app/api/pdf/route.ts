import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resp = await fetch(`${BACKEND}/report/pdf`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    if (!resp.ok) {
      return NextResponse.json({ error: "PDF generation failed" }, { status: resp.status });
    }
    const pdfBuffer = await resp.arrayBuffer();
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": 'attachment; filename="AuditIQ_Report.pdf"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Backend unreachable: ${String(err)}` },
      { status: 502 }
    );
  }
}
