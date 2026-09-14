import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNomorSurat } from "@/lib/nomor-surat";
import { getSession } from "@/lib/session";
import { cekPeran, PERAN_APPROVAL } from "@/lib/auth-guard";

// POST /api/pengajuan-surat/:id/setujui
// diprosesOlehId diambil dari session. Khusus peran SEKRETARIS/KEPALA_DESA/ADMIN.
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
      { error: "Peran kamu tidak punya akses untuk menyetujui surat" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const pengajuan = await prisma.pengajuanSurat.findUnique({ where: { id } });
  if (!pengajuan) {
    return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
  }
  if (pengajuan.status !== "DIAJUKAN" && pengajuan.status !== "DIPROSES") {
    return NextResponse.json(
      { error: `Pengajuan dengan status ${pengajuan.status} tidak bisa disetujui` },
      { status: 400 }
    );
  }

  const nomorSurat = await generateNomorSurat(pengajuan.jenisSuratId);

  const updated = await prisma.pengajuanSurat.update({
    where: { id },
    data: {
      status: "DISETUJUI",
      nomorSurat,
      diprosesOlehId: session.userId,
      tanggalDiproses: new Date(),
    },
    include: { jenisSurat: true, warga: true },
  });

  return NextResponse.json({ data: updated });
}
