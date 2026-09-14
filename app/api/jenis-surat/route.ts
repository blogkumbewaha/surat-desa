import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cekPeran, PERAN_ADMIN } from "@/lib/auth-guard";

// GET /api/jenis-surat?aktif=true
export async function GET(req: NextRequest) {
  const aktifParam = req.nextUrl.searchParams.get("aktif");

  const data = await prisma.jenisSurat.findMany({
    where: aktifParam !== null ? { aktif: aktifParam === "true" } : undefined,
    orderBy: { nama: "asc" },
  });

  return NextResponse.json({ data });
}

// POST /api/jenis-surat — khusus ADMIN
// body: { kode, nama, deskripsi?, formatNomor, skemaField, templateDokumen? }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!cekPeran(session, PERAN_ADMIN)) {
    return NextResponse.json({ error: "Khusus admin" }, { status: 403 });
  }

  const body = await req.json();
  const { kode, nama, deskripsi, formatNomor, skemaField, templateDokumen } = body;

  if (!kode || !nama || !formatNomor || !skemaField) {
    return NextResponse.json(
      { error: "kode, nama, formatNomor, dan skemaField wajib diisi" },
      { status: 400 }
    );
  }

  const jenisSurat = await prisma.jenisSurat.create({
    data: { kode, nama, deskripsi, formatNomor, skemaField, templateDokumen },
  });

  return NextResponse.json({ data: jenisSurat }, { status: 201 });
}
