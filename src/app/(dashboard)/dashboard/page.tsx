import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [totalWarga, menungguPersetujuan, disetujuiBulanIni, totalJenisSurat] =
    await Promise.all([
      prisma.warga.count(),
      prisma.pengajuanSurat.count({ where: { status: "DIAJUKAN" } }),
      prisma.pengajuanSurat.count({
        where: {
          status: { in: ["DISETUJUI", "DICETAK"] },
          tanggalDiproses: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      prisma.jenisSurat.count({ where: { aktif: true } }),
    ]);

  const cards = [
    { label: "Total Warga Terdata", value: totalWarga },
    { label: "Menunggu Persetujuan", value: menungguPersetujuan },
    { label: "Disetujui Bulan Ini", value: disetujuiBulanIni },
    { label: "Jenis Surat Aktif", value: totalJenisSurat },
  ];

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold text-slate-900">Dashboard</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
