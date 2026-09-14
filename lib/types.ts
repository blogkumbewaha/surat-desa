// Tipe untuk field dinamis yang disimpan sebagai JSON di JenisSurat.skemaField

export type TipeField = "text" | "textarea" | "number" | "date" | "select" | "table";

export interface FieldSurat {
  key: string; // dipakai sebagai key di PengajuanSurat.dataForm
  label: string; // ditampilkan di form
  type: TipeField;
  required: boolean;
  placeholder?: string;
  options?: string[]; // dipakai kalau type === "select"
  columns?: FieldSurat[]; // dipakai kalau type === "table" — definisi kolom per baris
  maxRows?: number; // dipakai kalau type === "table" — batas jumlah baris (opsional)
}

// Contoh isi skemaField untuk beberapa jenis surat:
export const CONTOH_SKEMA_FIELD: Record<string, FieldSurat[]> = {
  SKD: [
    // Surat Keterangan Domisili
    { key: "alamatDomisili", label: "Alamat Domisili Saat Ini", type: "text", required: true },
    { key: "keperluan", label: "Keperluan Surat", type: "textarea", required: true },
  ],
  SKTM: [
    // Surat Keterangan Tidak Mampu
    { key: "penghasilan", label: "Penghasilan per Bulan (Rp)", type: "number", required: true },
    { key: "jumlahTanggungan", label: "Jumlah Tanggungan Keluarga", type: "number", required: true },
    { key: "keperluan", label: "Keperluan Surat", type: "textarea", required: true },
  ],
  SKU: [
    // Surat Keterangan Usaha
    { key: "namaUsaha", label: "Nama Usaha", type: "text", required: true },
    { key: "jenisUsaha", label: "Jenis Usaha", type: "text", required: true },
    { key: "alamatUsaha", label: "Alamat Usaha", type: "text", required: true },
    { key: "lamaUsaha", label: "Lama Usaha Berjalan", type: "text", required: false },
  ],
};

export interface DataFormPengajuan {
  [key: string]: string | number | null | Record<string, string | number | null>[];
}
