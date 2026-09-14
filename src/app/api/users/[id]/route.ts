import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cekPeran, PERAN_ADMIN } from "@/lib/auth-guard";

// PATCH /api/users/:id
// body: { aktif?, role?, passwordBaru? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!cekPeran(session, PERAN_ADMIN)) {
    return NextResponse.json({ error: "Khusus admin" }, { status: 403 });
  }

  const { id } = await params;
  const { aktif, role, passwordBaru } = await req.json();

  const data: Record<string, unknown> = {};
  if (typeof aktif === "boolean") data.aktif = aktif;
  if (typeof role === "string") data.role = role;
  if (typeof passwordBaru === "string" && passwordBaru.length > 0) {
    if (passwordBaru.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }
    data.password = await bcrypt.hash(passwordBaru, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, nama: true, username: true, role: true, aktif: true },
  });

  return NextResponse.json({ data: user });
}
