import Link from "next/link";
import { prisma } from "@/lib/prisma";

const STATUS_STYLE: Record<string, string> = {
  DIAJUKAN: "bg-amber-100 text-amber-700",
  DIPROSES: "bg-blue-100 text-blue-700",
  DISETUJUI: "bg-green-100 text-green-700",
  DITOLAK: "bg-red-100 text-red-700",
  DICETAK: "bg-slate-100 text-slate-700",
};

export default async function PengajuanSuratPage() {
  const daftar = await prisma.pengajuanSurat.findMany({
    include: { jenisSurat: true, warga: true },
    orderBy: { tanggalDiajukan: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Pengajuan Surat</h2>
        <Link
          href="/pengajuan-surat/baru"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Buat Pengajuan
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Pemohon</th>
              <th className="px-4 py-3 font-medium">Jenis Surat</th>
              <th className="px-4 py-3 font-medium">Nomor Surat</th>
              <th className="px-4 py-3 font-medium">Tanggal Diajukan</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((item: (typeof daftar)[number]) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-900">
                  {item.warga?.nama || item.namaPemohon}
                </td>
                <td className="px-4 py-3 text-slate-600">{item.jenisSurat.nama}</td>
                <td className="px-4 py-3 text-slate-600">{item.nomorSurat || "-"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {item.tanggalDiajukan.toLocaleDateString("id-ID")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[item.status]}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/pengajuan-surat/${item.id}`}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
            {daftar.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Belum ada pengajuan surat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
