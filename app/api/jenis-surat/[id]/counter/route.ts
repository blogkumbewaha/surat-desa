import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cekPeran, PERAN_ADMIN } from "@/lib/auth-guard";

// GET /api/jenis-surat/:id/counter?tahun=2026
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tahun = Number(req.nextUrl.searchParams.get("tahun")) || new Date().getFullYear();

  const counter = await prisma.counterNomorSurat.findUnique({
    where: { jenisSuratId_tahun: { jenisSuratId: id, tahun } },
  });

  return NextResponse.json({ data: { tahun, counterTerakhir: counter?.counterTerakhir ?? 0 } });
}

// PUT /api/jenis-surat/:id/counter — khusus ADMIN
// body: { tahun, counterTerakhir }
// Dipakai untuk "melanjutkan" penomoran otomatis dari nomor urut terakhir
// yang sudah dipakai manual sebelum sistem ini ada — misal isi 360, maka
// pengajuan berikutnya yang disetujui akan dapat nomor 361.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!cekPeran(session, PERAN_ADMIN)) {
    return NextResponse.json({ error: "Khusus admin" }, { status: 403 });
  }

  const { id } = await params;
  const { tahun, counterTerakhir } = await req.json();

  if (typeof tahun !== "number" || typeof counterTerakhir !== "number" || counterTerakhir < 0) {
    return NextResponse.json(
      { error: "tahun dan counterTerakhir (angka >= 0) wajib diisi" },
      { status: 400 }
    );
  }

  const counter = await prisma.counterNomorSurat.upsert({
    where: { jenisSuratId_tahun: { jenisSuratId: id, tahun } },
    create: { jenisSuratId: id, tahun, counterTerakhir },
    update: { counterTerakhir },
  });

  return NextResponse.json({ data: counter });
}
