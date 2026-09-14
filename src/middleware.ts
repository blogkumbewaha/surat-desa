import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifikasiSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

const RUTE_PUBLIK = ["/login", "/api/auth/login"];

// Rute yang cuma boleh diakses peran ADMIN
const RUTE_ADMIN = ["/pengguna", "/api/users"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isRutePublik = RUTE_PUBLIK.some((r) => pathname === r || pathname.startsWith(r + "/"));

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifikasiSessionToken(token) : null;

  if (!session && !isRutePublik) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const isRuteAdmin = RUTE_ADMIN.some((r) => pathname === r || pathname.startsWith(r + "/"));
  if (isRuteAdmin && session?.role !== "ADMIN") {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Khusus admin" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Lindungi semua route kecuali file statis Next.js
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
