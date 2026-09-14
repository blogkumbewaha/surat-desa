import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { buatSessionToken, setSessionCookie } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.aktif) {
    return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  }

  const cocok = await bcrypt.compare(password, user.password);
  if (!cocok) {
    return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
  }

  const token = await buatSessionToken({ userId: user.id, nama: user.nama, role: user.role });
  await setSessionCookie(token);

  return NextResponse.json({ data: { id: user.id, nama: user.nama, role: user.role } });
}
