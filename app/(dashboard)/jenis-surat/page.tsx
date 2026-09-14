import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { FieldSurat } from "@/lib/types";
import AturCounter from "./AturCounter";

export default async function JenisSuratPage() {
  const [daftar, session] = await Promise.all([
    prisma.jenisSurat.findMany({ orderBy: { nama: "asc" } }),
    getSession(),
  ]);
  const isAdmin = session?.role === "ADMIN";

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">Jenis Surat</h2>
        <p className="mt-1 text-sm text-slate-500">
          {daftar.length} jenis surat terdaftar. Kelola dari `prisma/seed.ts` untuk sekarang —
          halaman tambah/edit dari UI menyusul.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {daftar.map((js: (typeof daftar)[number]) => {
          const fields = js.skemaField as unknown as FieldSurat[];
          return (
            <div key={js.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {js.kode}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    js.aktif ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {js.aktif ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <h3 className="mb-1 font-semibold text-slate-900">{js.nama}</h3>
              <p className="mb-3 text-xs text-slate-500">Format: {js.formatNomor}</p>
              <p className="text-xs text-slate-400">{fields.length} field isian</p>
              {js.templateDokumen && (
                <p className="mt-1 text-xs text-slate-400">Template: {js.templateDokumen}</p>
              )}
              {isAdmin && <AturCounter jenisSuratId={js.id} />}
            </div>
          );
        })}
        {daftar.length === 0 && (
          <p className="col-span-full py-8 text-center text-slate-400">
            Belum ada jenis surat. Jalankan `npm run db:seed`.
          </p>
        )}
      </div>
    </div>
  );
}
