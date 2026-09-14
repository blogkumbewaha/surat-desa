import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { FieldSurat, DataFormPengajuan } from "@/lib/types";
import AksiPengajuan from "./AksiPengajuan";

const STATUS_STYLE: Record<string, string> = {
  DIAJUKAN: "bg-amber-100 text-amber-700",
  DIPROSES: "bg-blue-100 text-blue-700",
  DISETUJUI: "bg-green-100 text-green-700",
  DITOLAK: "bg-red-100 text-red-700",
  DICETAK: "bg-slate-100 text-slate-700",
};

export default async function DetailPengajuanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const pengajuan = await prisma.pengajuanSurat.findUnique({
    where: { id },
    include: { jenisSurat: true, warga: true, dibuatOleh: true, diprosesOleh: true },
  });

  if (!pengajuan) notFound();

  const skemaField = pengajuan.jenisSurat.skemaField as unknown as FieldSurat[];
  const dataForm = pengajuan.dataForm as DataFormPengajuan;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/pengajuan-surat" className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-800">
        ← Kembali ke daftar
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{pengajuan.jenisSurat.nama}</h2>
            <p className="text-sm text-slate-500">
              {pengajuan.warga?.nama || pengajuan.namaPemohon} · {pengajuan.warga?.nik || pengajuan.nikPemohon}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[pengajuan.status]}`}>
            {pengajuan.status}
          </span>
        </div>

        <dl className="mb-6 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Nomor Surat</dt>
            <dd className="font-medium text-slate-900">{pengajuan.nomorSurat || "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Tanggal Diajukan</dt>
            <dd className="font-medium text-slate-900">
              {pengajuan.tanggalDiajukan.toLocaleDateString("id-ID")}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Diajukan Oleh</dt>
            <dd className="font-medium text-slate-900">{pengajuan.dibuatOleh.nama}</dd>
          </div>
          {pengajuan.diprosesOleh && (
            <div>
              <dt className="text-slate-500">Diproses Oleh</dt>
              <dd className="font-medium text-slate-900">{pengajuan.diprosesOleh.nama}</dd>
            </div>
          )}
        </dl>

        {pengajuan.catatan && (
          <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <strong>Catatan penolakan:</strong> {pengajuan.catatan}
          </div>
        )}

        <h3 className="mb-3 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-700">
          Detail Isian
        </h3>
        <dl className="mb-6 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
          {skemaField.filter((f) => f.type !== "table").map((field) => (
            <div key={field.key}>
              <dt className="text-slate-500">{field.label}</dt>
              <dd className="font-medium text-slate-900">{String(dataForm[field.key] ?? "-")}</dd>
            </div>
          ))}
        </dl>

        {skemaField.filter((f) => f.type === "table").map((field) => {
          const baris = (dataForm[field.key] as Record<string, string>[]) || [];
          return (
            <div key={field.key} className="mb-6">
              <h4 className="mb-2 text-sm font-semibold text-slate-700">{field.label}</h4>
              {baris.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada data.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-left text-slate-500">
                      <tr>
                        {(field.columns || []).map((kol) => (
                          <th key={kol.key} className="whitespace-nowrap px-2 py-2 font-medium">
                            {kol.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {baris.map((b, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          {(field.columns || []).map((kol) => (
                            <td key={kol.key} className="whitespace-nowrap px-2 py-2 text-slate-700">
                              {b[kol.key] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        <div className="border-t border-slate-100 pt-4">
          <AksiPengajuan
            id={pengajuan.id}
            status={pengajuan.status}
            role={session?.role || ""}
            templateDokumen={pengajuan.jenisSurat.templateDokumen}
          />
        </div>
      </div>
    </div>
  );
}
