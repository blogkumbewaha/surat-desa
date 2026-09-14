import Link from "next/link";
import { getSession } from "@/lib/session";
import LogoutButton from "./LogoutButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pengajuan-surat", label: "Pengajuan Surat" },
  { href: "/warga", label: "Data Warga" },
  { href: "/jenis-surat", label: "Jenis Surat" },
];

const ROLE_LABEL: Record<string, string> = {
  OPERATOR: "Operator",
  SEKRETARIS: "Sekretaris",
  KEPALA_DESA: "Kepala Desa",
  ADMIN: "Admin",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Middleware sudah memastikan hanya user yang login yang bisa sampai sini.
  const session = await getSession();
  const navItems =
    session?.role === "ADMIN"
      ? [...NAV_ITEMS, { href: "/pengguna", label: "Pengguna" }]
      : NAV_ITEMS;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-4">
        <div className="mb-8 px-2">
          <h1 className="text-lg font-semibold text-slate-900">Surat Desa</h1>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 pt-3">
          {session && (
            <p className="mb-1 px-3 text-xs text-slate-400">
              Masuk sebagai <span className="font-medium text-slate-600">{session.nama}</span>
              <br />
              <span className="text-slate-400">{ROLE_LABEL[session.role] || session.role}</span>
            </p>
          )}
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
