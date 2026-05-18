import { NextResponse } from "next/server";
import { downloadPDF } from "@/lib/storage";

export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;

  if (filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  try {
    const bytes = await downloadPDF(filename);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "PDF introuvable" }, { status: 404 });
  }
}
