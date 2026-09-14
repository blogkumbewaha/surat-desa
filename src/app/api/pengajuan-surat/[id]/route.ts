import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cekPeran, PERAN_ADMIN } from "@/lib/auth-guard";

// GET /api/pengajuan-surat/:id — detail satu pengajuan
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await prisma.pengajuanSurat.findUnique({
    where: { id },
    include: { jenisSurat: true, warga: true, dibuatOleh: true, diprosesOleh: true },
  });
  if (!data) {
    return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ data });
}

// DELETE /api/pengajuan-surat/:id — khusus ADMIN
// Catatan: nomor surat yang sudah pernah dikeluarkan TIDAK didaur ulang
// meski pengajuannya dihapus — ini wajar & sesuai praktik penomoran surat
// resmi (nomor yang sudah terpakai tidak dipakai ulang untuk surat lain).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!cekPeran(session, PERAN_ADMIN)) {
    return NextResponse.json({ error: "Khusus admin yang bisa menghapus pengajuan" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.pengajuanSurat.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Pengajuan tidak ditemukan" }, { status: 404 });
  }

  await prisma.pengajuanSurat.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
