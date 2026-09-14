import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// GET /api/pengajuan-surat?status=DIAJUKAN
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");

  const data = await prisma.pengajuanSurat.findMany({
    where: status ? { status: status as never } : undefined,
    include: {
      jenisSurat: true,
      warga: true,
      dibuatOleh: { select: { id: true, nama: true } },
    },
    orderBy: { tanggalDiajukan: "desc" },
  });

  return NextResponse.json({ data });
}

// POST /api/pengajuan-surat
// body: { jenisSuratId, wargaId, dataForm }
// wargaId didapat dari hasil upsert ke /api/warga (dipanggil client sebelum
// ini) — jadi data pemohon sudah pasti tersimpan/terupdate di tabel Warga
// sebelum pengajuan dibuat. dibuatOlehId diambil dari session.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const body = await req.json();
  const { jenisSuratId, wargaId, dataForm } = body;

  if (!jenisSuratId || !wargaId || !dataForm) {
    return NextResponse.json(
      { error: "jenisSuratId, wargaId, dan dataForm wajib diisi" },
      { status: 400 }
    );
  }

  const pengajuan = await prisma.pengajuanSurat.create({
    data: {
      jenisSuratId,
      wargaId,
      dataForm,
      dibuatOlehId: session.userId,
    },
    include: { jenisSurat: true, warga: true },
  });

  return NextResponse.json({ data: pengajuan }, { status: 201 });
}
