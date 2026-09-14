import { NextResponse } from "next/server";
import { hapusSessionCookie } from "@/lib/session";

export async function POST() {
  await hapusSessionCookie();
  return NextResponse.json({ ok: true });
}
