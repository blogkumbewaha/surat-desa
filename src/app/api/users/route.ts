import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cekPeran, PERAN_ADMIN } from "@/lib/auth-guard";

// GET /api/users — daftar semua pengguna (tanpa password)
export async function GET() {
  const session = await getSession();
  if (!cekPeran(session, PERAN_ADMIN)) {
    return NextResponse.json({ error: "Khusus admin" }, { status: 403 });
  }

  const data = await prisma.user.findMany({
    select: { id: true, nama: true, username: true, role: true, aktif: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data });
}

// POST /api/users — buat pengguna baru
// body: { nama, username, password, role }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!cekPeran(session, PERAN_ADMIN)) {
    return NextResponse.json({ error: "Khusus admin" }, { status: 403 });
  }

  const { nama, username, password, role } = await req.json();

  if (!nama || !username || !password || !role) {
    return NextResponse.json(
      { error: "nama, username, password, dan role wajib diisi" },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }
  const rolesValid = ["OPERATOR", "SEKRETARIS", "KEPALA_DESA", "ADMIN"];
  if (!rolesValid.includes(role)) {
    return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
  }

  const sudahAda = await prisma.user.findUnique({ where: { username } });
  if (sudahAda) {
    return NextResponse.json({ error: "Username sudah dipakai" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { nama, username, password: hashedPassword, role },
    select: { id: true, nama: true, username: true, role: true, aktif: true },
  });

  return NextResponse.json({ data: user }, { status: 201 });
}
