import { NextRequest, NextResponse } from "next/server";
import {
  generateDokumenSurat,
  GenerateDokumenError,
} from "@/lib/generate-dokumen";
import { convertKePdf, LibreOfficeTidakDitemukanError } from "@/lib/convert-pdf";

const MIME_TYPE: Record<string, string> = {
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

// GET /api/pengajuan-surat/:id/cetak?format=asli|pdf  (default: asli)
// "asli" = format sesuai template (docx atau xlsx, mengikuti jenis suratnya)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "asli";

  try {
    const { buffer, filename, ekstensiAsli } = await generateDokumenSurat(id);

    if (format === "asli") {
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": MIME_TYPE[ekstensiAsli] || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${filename}${ekstensiAsli}"`,
        },
      });
    }

    // format === "pdf"
    const pdfBuffer = await convertKePdf(buffer, ekstensiAsli);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof GenerateDokumenError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof LibreOfficeTidakDitemukanError) {
      return NextResponse.json({ error: error.message }, { status: 501 });
    }
    console.error("Gagal generate dokumen:", error);
    return NextResponse.json({ error: "Gagal membuat dokumen" }, { status: 500 });
  }
}
