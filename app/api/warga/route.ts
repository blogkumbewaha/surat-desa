import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { keKodeJenisKelamin } from "@/lib/jenis-kelamin";

// GET /api/warga?q=nama-atau-nik
// Tanpa query "q", kembalikan daftar warga terbaru (untuk halaman listing).
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";

  if (!q) {
    const data = await prisma.warga.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ data });
  }

  const data = await prisma.warga.findMany({
    where: {
      OR: [
        { nik: { contains: q } },
        { nama: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 10,
  });

  return NextResponse.json({ data });
}

// POST /api/warga
// Upsert berdasarkan NIK — dipakai untuk tambah warga baru dari halaman Data
// Warga, ATAU untuk sinkronisasi otomatis dari form pengajuan surat.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    nik, nama, tempatLahir, tanggalLahir, jenisKelamin,
    pekerjaan, alamat, noKK, noHp, agama, statusPerkawinan, rt, rw,
  } = body;

  if (!nik || !nama) {
    return NextResponse.json({ error: "nik dan nama wajib diisi" }, { status: 400 });
  }

  const data = {
    nama,
    tempatLahir: tempatLahir || undefined,
    tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : undefined,
    jenisKelamin: keKodeJenisKelamin(jenisKelamin),
    pekerjaan: pekerjaan || undefined,
    alamat: alamat || undefined,
    noKK: noKK || undefined,
    noHp: noHp || undefined,
    agama: agama || undefined,
    statusPerkawinan: statusPerkawinan || undefined,
    rt: rt || undefined,
    rw: rw || undefined,
  };

  const warga = await prisma.warga.upsert({
    where: { nik },
    create: { nik, ...data },
    update: data,
  });

  return NextResponse.json({ data: warga }, { status: 201 });
}
