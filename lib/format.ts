const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** Format tanggal jadi "24 Agustus 2026" */
export function formatTanggalIndonesia(date: Date): string {
  return `${date.getDate()} ${NAMA_BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Ambil kembali komponen {nomor_urut}, {bulan_romawi}, {tahun} dari string
 * nomorSurat yang sudah jadi, menggunakan formatNomor asli sebagai pola.
 * Contoh: formatNomor "300.3/{nomor_urut}/{bulan_romawi}/{tahun}"
 *         nomorSurat  "300.3/003/VIII/2026"
 *      -> { nomor_urut: "003", bulan_romawi: "VIII", tahun: "2026" }
 */
export function parseNomorSuratComponents(
  formatNomor: string,
  nomorSurat: string
): { nomor_urut: string; bulan_romawi: string; tahun: string } | null {
  const escaped = formatNomor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped
    .replace("\\{nomor_urut\\}", "(?<nomor_urut>[^/]+)")
    .replace("\\{bulan_romawi\\}", "(?<bulan_romawi>[IVXLCDM]+)")
    .replace("\\{tahun\\}", "(?<tahun>\\d{4})");

  const match = nomorSurat.match(new RegExp(`^${pattern}$`));
  if (!match || !match.groups) return null;

  return {
    nomor_urut: match.groups.nomor_urut,
    bulan_romawi: match.groups.bulan_romawi,
    tahun: match.groups.tahun,
  };
}
