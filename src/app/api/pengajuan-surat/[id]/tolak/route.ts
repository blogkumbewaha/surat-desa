import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cekPeran, PERAN_APPROVAL } from "@/lib/auth-guard";

// POST /api/pengajuan-surat/:id/tolak
// body: { catatan }. Khusus peran SEKRETARIS/KEPALA_DESA/ADMIN.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }
  if (!cekPeran(session, PERAN_APPROVAL)) {
    return NextResponse.json(
      { error: "Peran kamu tidak punya akses untuk menolak surat" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const { catatan } = await req.json();

  if (!catatan) {
    return NextResponse.json(
      { error: "catatan alasan penolakan wajib diisi" },
      { status: 400 }
    );
  }

  const updated = await prisma.pengajuanSurat.update({
    where: { id },
    data: {
      status: "DITOLAK",
      catatan,
      diprosesOlehId: session.userId,
      tanggalDiproses: new Date(),
    },
  });

  return NextResponse.json({ data: updated });
}
