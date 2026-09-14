import { prisma } from "@/lib/prisma";

const BULAN_ROMAWI = [
  "I", "II", "III", "IV", "V", "VI",
  "VII", "VIII", "IX", "X", "XI", "XII",
];

const NAMA_DESA = process.env.NAMA_DESA || "DESA CONTOH";

/**
 * Generate nomor surat otomatis untuk sebuah jenis surat pada tahun berjalan.
 * Counter di-increment secara atomik lewat transaction supaya aman
 * dari race condition kalau ada beberapa pengajuan disetujui bersamaan.
 */
export async function generateNomorSurat(jenisSuratId: string): Promise<string> {
  const now = new Date();
  const tahun = now.getFullYear();
  const bulanRomawi = BULAN_ROMAWI[now.getMonth()];

  const jenisSurat = await prisma.jenisSurat.findUniqueOrThrow({
    where: { id: jenisSuratId },
  });

  const counter = await prisma.counterNomorSurat.upsert({
    where: {
      jenisSuratId_tahun: { jenisSuratId, tahun },
    },
    create: {
      jenisSuratId,
      tahun,
      counterTerakhir: 1,
    },
    update: {
      counterTerakhir: { increment: 1 },
    },
  });

  const nomorUrut = String(counter.counterTerakhir).padStart(3, "0");

  // formatNomor contoh: "300.3/{nomor_urut}/{bulan_romawi}/{tahun}"
  // {kode} dan {desa} dibiarkan sebagai fallback opsional (no-op kalau tidak dipakai di formatNomor).
  return jenisSurat.formatNomor
    .replace("{nomor_urut}", nomorUrut)
    .replace("{kode}", jenisSurat.kode)
    .replace("{desa}", NAMA_DESA)
    .replace("{bulan_romawi}", bulanRomawi)
    .replace("{tahun}", String(tahun));
}
