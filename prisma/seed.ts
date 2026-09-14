import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { FieldSurat } from "../src/lib/types";

const prisma = new PrismaClient();

const PASSWORD_ADMIN_DEFAULT = "admin123";

// Field umum identitas pemohon (dipakai berulang di banyak jenis surat).
// Meski pemohon bisa dipilih dari data Warga (auto-fill), field ini tetap
// disimpan di dataForm supaya nilai pada surat tersebut "terkunci" sesuai
// kondisi saat surat dibuat (mis. alamat/pekerjaan bisa berubah di kemudian hari).
const IDENTITAS_DASAR: FieldSurat[] = [
  { key: "nama", label: "Nama Lengkap", type: "text", required: true },
  { key: "nik", label: "NIK", type: "text", required: true },
  { key: "tempat_tanggal_lahir", label: "Tempat/Tanggal Lahir", type: "text", required: true },
  { key: "jenis_kelamin", label: "Jenis Kelamin", type: "select", required: true, options: ["Laki-laki", "Perempuan"] },
  { key: "pekerjaan", label: "Pekerjaan", type: "text", required: true },
  { key: "alamat", label: "Alamat", type: "text", required: true },
];

// 11 jenis surat sesuai template Word yang sudah disiapkan di /templates.
// `templateDokumen` menunjuk ke nama file di folder templates/.
// `formatNomor` memakai kode klasifikasi ASLI dari tiap surat (bukan `kode` internal di bawah).
const JENIS_SURAT: Array<{
  kode: string;
  nama: string;
  formatNomor: string;
  templateDokumen: string;
  skemaField: FieldSurat[];
}> = [
  {
    kode: "SKL",
    nama: "Surat Keterangan Kenal Lahir",
    formatNomor: "300.3/{nomor_urut}/{bulan_romawi}/{tahun}",
    templateDokumen: "suket-kenal-lahir.docx",
    skemaField: [
      { key: "ayah_nama", label: "Nama Ayah", type: "text", required: true },
      { key: "ayah_nik", label: "NIK Ayah", type: "text", required: true },
      { key: "ayah_ttl", label: "Tempat/Tanggal Lahir Ayah", type: "text", required: true },
      { key: "ayah_jenis_kelamin", label: "Jenis Kelamin Ayah", type: "text", required: true },
      { key: "ayah_pekerjaan", label: "Pekerjaan Ayah", type: "text", required: true },
      { key: "ayah_alamat", label: "Alamat Ayah", type: "text", required: true },
      { key: "ibu_nama", label: "Nama Ibu", type: "text", required: true },
      { key: "ibu_nik", label: "NIK Ibu", type: "text", required: true },
      { key: "ibu_ttl", label: "Tempat/Tanggal Lahir Ibu", type: "text", required: true },
      { key: "ibu_jenis_kelamin", label: "Jenis Kelamin Ibu", type: "text", required: true },
      { key: "ibu_pekerjaan", label: "Pekerjaan Ibu", type: "text", required: true },
      { key: "ibu_alamat", label: "Alamat Ibu", type: "text", required: true },
      { key: "anak_nama", label: "Nama Anak", type: "text", required: true },
      { key: "anak_tempat_lahir", label: "Tempat Lahir Anak", type: "text", required: true },
      { key: "anak_hari_tanggal_lahir", label: "Hari/Tanggal Lahir Anak", type: "text", required: true },
      { key: "anak_pukul", label: "Pukul Lahir", type: "text", required: true },
      { key: "anak_ke", label: "Anak Ke-", type: "number", required: true },
      { key: "anak_alamat", label: "Alamat Anak", type: "text", required: true },
    ],
  },
  {
    kode: "SPIK",
    nama: "Pengantar Permohonan Izin Keramaian",
    formatNomor: "400.10.2/{nomor_urut}/{bulan_romawi}/{tahun}",
    templateDokumen: "pengantar-permohonan-izin-keramaian.docx",
    skemaField: [
      ...IDENTITAS_DASAR,
      { key: "hari_tanggal_acara", label: "Hari/Tanggal Acara", type: "text", required: true },
      { key: "waktu_acara", label: "Waktu Acara", type: "text", required: true },
      { key: "nama_acara", label: "Nama Acara", type: "text", required: true },
      { key: "tempat_acara", label: "Tempat Acara", type: "text", required: true },
    ],
  },
  {
    kode: "SKBB",
    nama: "Surat Keterangan Berkelakuan Baik",
    formatNomor: "100.3/{nomor_urut}/{bulan_romawi}/{tahun}",
    templateDokumen: "suket-berkelakuan-baik.docx",
    skemaField: [...IDENTITAS_DASAR],
  },
  {
    kode: "SKD",
    nama: "Surat Keterangan Domisili",
    formatNomor: "400.10.2/{nomor_urut}/{bulan_romawi}/{tahun}",
    templateDokumen: "suket-domisili.docx",
    skemaField: [...IDENTITAS_DASAR],
  },
  {
    kode: "SKK",
    nama: "Surat Keterangan Kematian",
    formatNomor: "400.12.03/{nomor_urut}/{bulan_romawi}/{tahun}",
    templateDokumen: "suket-kematian.docx",
    skemaField: [
      { key: "almarhum_nama", label: "Nama Almarhum/Almarhumah", type: "text", required: true },
      { key: "almarhum_nik", label: "NIK", type: "text", required: true },
      { key: "almarhum_jenis_kelamin", label: "Jenis Kelamin", type: "text", required: true },
      { key: "almarhum_tempat_tanggal_lahir", label: "Tempat/Tanggal Lahir", type: "text", required: true },
      { key: "almarhum_agama", label: "Agama", type: "text", required: true },
      { key: "almarhum_pekerjaan", label: "Pekerjaan", type: "text", required: true },
      { key: "almarhum_alamat", label: "Alamat", type: "text", required: true },
      { key: "tanggal_meninggal", label: "Tanggal Meninggal", type: "date", required: true },
      { key: "tempat_meninggal", label: "Tempat Meninggal", type: "text", required: true },
      { key: "penyebab_kematian", label: "Penyebab Kematian", type: "text", required: true },
      { key: "tempat_pemakaman", label: "Tempat Dimakamkan", type: "text", required: true },
      { key: "tanggal_pemakaman", label: "Tanggal Pemakaman", type: "date", required: true },
    ],
  },
  {
    kode: "SKPH",
    nama: "Surat Keterangan Penghasilan",
    formatNomor: "300.1/{nomor_urut}/{bulan_romawi}/{tahun}",
    templateDokumen: "suket-penghasilan.docx",
    skemaField: [
      ...IDENTITAS_DASAR,
      { key: "agama", label: "Agama", type: "text", required: true },
    ],
  },
  {
    kode: "SKTMK",
    nama: "Surat Keterangan Telah Menikah",
    formatNomor: "474.2/{nomor_urut}/{bulan_romawi}/{tahun}",
    templateDokumen: "suket-telah-menikah.docx",
    skemaField: [
      { key: "suami_nama", label: "Nama Suami", type: "text", required: true },
      { key: "suami_nik", label: "NIK Suami", type: "text", required: true },
      { key: "suami_tempat_tanggal_lahir", label: "Tempat/Tanggal Lahir Suami", type: "text", required: true },
      { key: "suami_jenis_kelamin", label: "Jenis Kelamin Suami", type: "text", required: true },
      { key: "suami_pekerjaan", label: "Pekerjaan Suami", type: "text", required: true },
      { key: "suami_alamat", label: "Alamat Suami", type: "text", required: true },
      { key: "istri_nama", label: "Nama Istri", type: "text", required: true },
      { key: "istri_nik", label: "NIK Istri", type: "text", required: true },
      { key: "istri_tempat_tanggal_lahir", label: "Tempat/Tanggal Lahir Istri", type: "text", required: true },
      { key: "istri_jenis_kelamin", label: "Jenis Kelamin Istri", type: "text", required: true },
      { key: "istri_pekerjaan", label: "Pekerjaan Istri", type: "text", required: true },
      { key: "istri_alamat", label: "Alamat Istri", type: "text", required: true },
      { key: "tanggal_menikah", label: "Tanggal Menikah", type: "date", required: true },
    ],
  },
  {
    kode: "SKTBD",
    nama: "Surat Keterangan Tidak Berada di Tempat",
    formatNomor: "300.3/{nomor_urut}/{bulan_romawi}/{tahun}",
    templateDokumen: "suket-tidak-berada-ditempat.docx",
    skemaField: [...IDENTITAS_DASAR],
  },
  {
    kode: "SKTM",
    nama: "Surat Keterangan Tidak Mampu",
    formatNomor: "400.10.2/{nomor_urut}/{bulan_romawi}/{tahun}",
    templateDokumen: "suket-tidak-mampu.docx",
    skemaField: [
      { key: "ortu_nama", label: "Nama Orang Tua/Wali", type: "text", required: true },
      { key: "ortu_nik", label: "NIK Orang Tua/Wali", type: "text", required: true },
      { key: "ortu_nkk", label: "No. KK Orang Tua/Wali", type: "text", required: true },
      { key: "ortu_tempat_tanggal_lahir", label: "Tempat/Tanggal Lahir Orang Tua/Wali", type: "text", required: true },
      { key: "ortu_jenis_kelamin", label: "Jenis Kelamin Orang Tua/Wali", type: "text", required: true },
      { key: "ortu_pekerjaan", label: "Pekerjaan Orang Tua/Wali", type: "text", required: true },
      { key: "ortu_alamat", label: "Alamat Orang Tua/Wali", type: "text", required: true },
      { key: "siswa_nama", label: "Nama Siswa", type: "text", required: true },
      { key: "siswa_nik", label: "NIK Siswa", type: "text", required: true },
      { key: "siswa_tempat_tanggal_lahir", label: "Tempat/Tanggal Lahir Siswa", type: "text", required: true },
      { key: "siswa_jenis_kelamin", label: "Jenis Kelamin Siswa", type: "text", required: true },
      { key: "siswa_pekerjaan", label: "Pekerjaan/Status Siswa", type: "text", required: true },
      { key: "siswa_alamat", label: "Alamat Siswa", type: "text", required: true },
    ],
  },
  {
    kode: "SKU",
    nama: "Surat Keterangan Usaha",
    formatNomor: "300.3/{nomor_urut}/{bulan_romawi}/{tahun}",
    templateDokumen: "suket-usaha.docx",
    skemaField: [
      ...IDENTITAS_DASAR,
      { key: "jenis_usaha", label: "Jenis Usaha", type: "text", required: true },
      { key: "tempat_usaha", label: "Tempat Usaha", type: "text", required: true },
      { key: "tahun_berdiri", label: "Tahun Berdiri Usaha", type: "text", required: true },
    ],
  },
  {
    // CATATAN PENTING: file ini berisi 5 model surat KUA berbeda (N-1 s/d N-5)
    // digabung dalam satu dokumen Word (satu file = 5 halaman berbeda).
    // Placeholder-nya diberi prefix n1_/n2_/n3_/n4_/n5_ sesuai modelnya.
    // Model N-1, N-2, N-4 punya nomor surat sendiri-sendiri (n1_nomor_urut,
    // n2_nomor_urut, n4_nomor_urut) — helper generateNomorSurat() di
    // src/lib/nomor-surat.ts SAAT INI hanya menghasilkan SATU nomor per
    // pengajuan, jadi perlu disesuaikan lagi (mis. generate 3 nomor sekaligus)
    // sebelum jenis surat ini benar-benar bisa dipakai end-to-end.
    kode: "NIKAH",
    nama: "Formulir Pengantar Nikah (Model N1-N5)",
    formatNomor: "400.12.3.2/{nomor_urut}/PDK/{bulan_romawi}/{tahun}",
    templateDokumen: "formulir-pengantar-nikah.docx",
    skemaField: [
      // Model N-1: Surat Keterangan Untuk Nikah
      { key: "n1_nama", label: "[N1] Nama Lengkap dan Alias", type: "text", required: true },
      { key: "n1_jenis_kelamin", label: "[N1] Jenis Kelamin", type: "text", required: true },
      { key: "n1_nik", label: "[N1] NIK", type: "text", required: true },
      { key: "n1_tempat_tanggal_lahir", label: "[N1] Tempat/Tanggal Lahir", type: "text", required: true },
      { key: "n1_warga_negara", label: "[N1] Warga Negara", type: "text", required: true },
      { key: "n1_agama", label: "[N1] Agama", type: "text", required: true },
      { key: "n1_pekerjaan", label: "[N1] Pekerjaan", type: "text", required: true },
      { key: "n1_tempat_tinggal", label: "[N1] Tempat Tinggal", type: "text", required: true },
      { key: "n1_bin_binti", label: "[N1] Bin/Binti", type: "text", required: true },
      { key: "n1_status_pria", label: "[N1] Status (jika pria: jejaka/duda, jumlah istri)", type: "text", required: false },
      { key: "n1_status_wanita", label: "[N1] Status (jika wanita: perawan/janda)", type: "text", required: false },
      { key: "n1_nama_pasangan_terdahulu", label: "[N1] Nama Suami/Istri Terdahulu", type: "text", required: false },
      // Model N-2: Surat Keterangan Asal Usul
      { key: "n2_nama", label: "[N2] Nama Lengkap dan Alias", type: "text", required: true },
      { key: "n2_nik", label: "[N2] NIK", type: "text", required: true },
      { key: "n2_tempat_tanggal_lahir", label: "[N2] Tempat/Tanggal Lahir", type: "text", required: true },
      { key: "n2_warga_negara", label: "[N2] Warga Negara", type: "text", required: true },
      { key: "n2_agama", label: "[N2] Agama", type: "text", required: true },
      { key: "n2_pekerjaan", label: "[N2] Pekerjaan", type: "text", required: true },
      { key: "n2_tempat_tinggal", label: "[N2] Tempat Tinggal", type: "text", required: true },
      { key: "n2_ayah_nama", label: "[N2] Nama Ayah Kandung", type: "text", required: true },
      { key: "n2_ayah_nik", label: "[N2] NIK Ayah", type: "text", required: true },
      { key: "n2_ayah_tempat_tanggal_lahir", label: "[N2] Tempat/Tgl Lahir Ayah", type: "text", required: true },
      { key: "n2_ayah_warga_negara", label: "[N2] Warga Negara Ayah", type: "text", required: true },
      { key: "n2_ayah_agama", label: "[N2] Agama Ayah", type: "text", required: true },
      { key: "n2_ayah_pekerjaan", label: "[N2] Pekerjaan Ayah", type: "text", required: true },
      { key: "n2_ayah_alamat", label: "[N2] Alamat Ayah", type: "text", required: true },
      { key: "n2_ibu_nama", label: "[N2] Nama Ibu Kandung", type: "text", required: true },
      { key: "n2_ibu_nik", label: "[N2] NIK Ibu", type: "text", required: true },
      { key: "n2_ibu_tempat_tanggal_lahir", label: "[N2] Tempat/Tgl Lahir Ibu", type: "text", required: true },
      { key: "n2_ibu_warga_negara", label: "[N2] Warga Negara Ibu", type: "text", required: true },
      { key: "n2_ibu_agama", label: "[N2] Agama Ibu", type: "text", required: true },
      { key: "n2_ibu_pekerjaan", label: "[N2] Pekerjaan Ibu", type: "text", required: true },
      { key: "n2_ibu_alamat", label: "[N2] Alamat Ibu", type: "text", required: true },
      // Model N-3: Surat Persetujuan Mempelai
      { key: "n3_suami_nama", label: "[N3] Nama Calon Suami", type: "text", required: true },
      { key: "n3_suami_nik", label: "[N3] NIK Calon Suami", type: "text", required: true },
      { key: "n3_suami_tempat_tanggal_lahir", label: "[N3] Tempat/Tgl Lahir Calon Suami", type: "text", required: true },
      { key: "n3_suami_warga_negara", label: "[N3] Warga Negara Calon Suami", type: "text", required: true },
      { key: "n3_suami_agama", label: "[N3] Agama Calon Suami", type: "text", required: true },
      { key: "n3_suami_pekerjaan", label: "[N3] Pekerjaan Calon Suami", type: "text", required: true },
      { key: "n3_suami_tempat_tinggal", label: "[N3] Tempat Tinggal Calon Suami", type: "text", required: true },
      { key: "n3_istri_nama", label: "[N3] Nama Calon Istri", type: "text", required: true },
      { key: "n3_istri_nik", label: "[N3] NIK Calon Istri", type: "text", required: true },
      { key: "n3_istri_tempat_tanggal_lahir", label: "[N3] Tempat/Tgl Lahir Calon Istri", type: "text", required: true },
      { key: "n3_istri_warga_negara", label: "[N3] Warga Negara Calon Istri", type: "text", required: true },
      { key: "n3_istri_agama", label: "[N3] Agama Calon Istri", type: "text", required: true },
      { key: "n3_istri_pekerjaan", label: "[N3] Pekerjaan Calon Istri", type: "text", required: true },
      { key: "n3_istri_tempat_tinggal", label: "[N3] Tempat Tinggal Calon Istri", type: "text", required: true },
      // Model N-4: Surat Keterangan Tentang Orang Tua
      { key: "n4_ayah_nama", label: "[N4] Nama Ayah", type: "text", required: true },
      { key: "n4_ayah_nik", label: "[N4] NIK Ayah", type: "text", required: true },
      { key: "n4_ayah_tempat_tanggal_lahir", label: "[N4] Tempat/Tgl Lahir Ayah", type: "text", required: true },
      { key: "n4_ayah_warga_negara", label: "[N4] Warga Negara Ayah", type: "text", required: true },
      { key: "n4_ayah_agama", label: "[N4] Agama Ayah", type: "text", required: true },
      { key: "n4_ayah_pekerjaan", label: "[N4] Pekerjaan Ayah", type: "text", required: true },
      { key: "n4_ayah_alamat", label: "[N4] Alamat Ayah", type: "text", required: true },
      { key: "n4_ibu_nama", label: "[N4] Nama Ibu", type: "text", required: true },
      { key: "n4_ibu_nik", label: "[N4] NIK Ibu", type: "text", required: true },
      { key: "n4_ibu_tempat_tanggal_lahir", label: "[N4] Tempat/Tgl Lahir Ibu", type: "text", required: true },
      { key: "n4_ibu_warga_negara", label: "[N4] Warga Negara Ibu", type: "text", required: true },
      { key: "n4_ibu_agama", label: "[N4] Agama Ibu", type: "text", required: true },
      { key: "n4_ibu_pekerjaan", label: "[N4] Pekerjaan Ibu", type: "text", required: true },
      { key: "n4_ibu_alamat", label: "[N4] Alamat Ibu", type: "text", required: true },
      { key: "n4_anak_nama", label: "[N4] Nama Anak", type: "text", required: true },
      { key: "n4_anak_nik", label: "[N4] NIK Anak", type: "text", required: true },
      { key: "n4_anak_tempat_tanggal_lahir", label: "[N4] Tempat/Tgl Lahir Anak", type: "text", required: true },
      { key: "n4_anak_warga_negara", label: "[N4] Warga Negara Anak", type: "text", required: true },
      { key: "n4_anak_agama", label: "[N4] Agama Anak", type: "text", required: true },
      { key: "n4_anak_pekerjaan", label: "[N4] Pekerjaan Anak", type: "text", required: true },
      { key: "n4_anak_tempat_tinggal", label: "[N4] Tempat Tinggal Anak", type: "text", required: true },
      // Model N-5: Surat Izin Orang Tua/Wali
      { key: "n5_ayah_nama", label: "[N5] Nama Ayah", type: "text", required: true },
      { key: "n5_ayah_nik", label: "[N5] NIK Ayah", type: "text", required: true },
      { key: "n5_ayah_tempat_tanggal_lahir", label: "[N5] Tempat/Tgl Lahir Ayah", type: "text", required: true },
      { key: "n5_ayah_warga_negara", label: "[N5] Warga Negara Ayah", type: "text", required: true },
      { key: "n5_ayah_agama", label: "[N5] Agama Ayah", type: "text", required: true },
      { key: "n5_ayah_pekerjaan", label: "[N5] Pekerjaan Ayah", type: "text", required: true },
      { key: "n5_ayah_alamat", label: "[N5] Alamat Ayah", type: "text", required: true },
      { key: "n5_ibu_nama", label: "[N5] Nama Ibu", type: "text", required: true },
      { key: "n5_ibu_nik", label: "[N5] NIK Ibu", type: "text", required: true },
      { key: "n5_ibu_tempat_tanggal_lahir", label: "[N5] Tempat/Tgl Lahir Ibu", type: "text", required: true },
      { key: "n5_ibu_warga_negara", label: "[N5] Warga Negara Ibu", type: "text", required: true },
      { key: "n5_ibu_agama", label: "[N5] Agama Ibu", type: "text", required: true },
      { key: "n5_ibu_pekerjaan", label: "[N5] Pekerjaan Ibu", type: "text", required: true },
      { key: "n5_ibu_alamat", label: "[N5] Alamat Ibu", type: "text", required: true },
      { key: "n5_anak_nama", label: "[N5] Nama Anak", type: "text", required: true },
      { key: "n5_anak_nik", label: "[N5] NIK Anak", type: "text", required: true },
      { key: "n5_anak_tempat_tanggal_lahir", label: "[N5] Tempat/Tgl Lahir Anak", type: "text", required: true },
      { key: "n5_anak_warga_negara", label: "[N5] Warga Negara Anak", type: "text", required: true },
      { key: "n5_anak_agama", label: "[N5] Agama Anak", type: "text", required: true },
      { key: "n5_anak_pekerjaan", label: "[N5] Pekerjaan Anak", type: "text", required: true },
      { key: "n5_anak_tempat_tinggal", label: "[N5] Tempat Tinggal Anak", type: "text", required: true },
      { key: "n5_pasangan_nama", label: "[N5] Nama Calon Pasangan", type: "text", required: true },
      { key: "n5_pasangan_nik", label: "[N5] NIK Calon Pasangan", type: "text", required: true },
      { key: "n5_pasangan_tempat_tanggal_lahir", label: "[N5] Tempat/Tgl Lahir Calon Pasangan", type: "text", required: true },
      { key: "n5_pasangan_warga_negara", label: "[N5] Warga Negara Calon Pasangan", type: "text", required: true },
      { key: "n5_pasangan_agama", label: "[N5] Agama Calon Pasangan", type: "text", required: true },
      { key: "n5_pasangan_pekerjaan", label: "[N5] Pekerjaan Calon Pasangan", type: "text", required: true },
      { key: "n5_pasangan_tempat_tinggal", label: "[N5] Tempat Tinggal Calon Pasangan", type: "text", required: true },
    ],
  },
  {
    // CATATAN: satu-satunya jenis surat yang template-nya .xlsx (bukan .docx)
    // — cara render dokumennya beda, lihat src/lib/generate-dokumen-xlsx.ts
    // (nulis langsung ke koordinat cell, bukan pakai placeholder {}).
    kode: "FKK",
    nama: "Formulir Pengantar Kartu Keluarga (KK)",
    formatNomor: "400.10.2/{nomor_urut}/PDK/{bulan_romawi}/{tahun}",
    templateDokumen: "formulir-kk.xlsx",
    skemaField: [
      { key: "nama_kepala_keluarga", label: "Nama Kepala Keluarga", type: "text", required: true },
      { key: "alamat", label: "Alamat", type: "text", required: true },
      { key: "rt_rw", label: "RT/RW", type: "text", required: false },
      { key: "kode_pos", label: "Kode Pos", type: "text", required: false },
      { key: "nomor_kk_lama", label: "Nomor KK Lama (kalau ada)", type: "text", required: false },
      {
        key: "anggota_keluarga",
        label: "Anggota Keluarga",
        type: "table",
        required: true,
        maxRows: 10, // sesuai jumlah baris yang disediakan template
        columns: [
          { key: "nama", label: "Nama Lengkap", type: "text", required: true },
          { key: "nik", label: "NIK", type: "text", required: true },
          { key: "jenis_kelamin", label: "Jenis Kelamin", type: "select", required: true, options: ["Laki-laki", "Perempuan"] },
          { key: "tempat_lahir", label: "Tempat Lahir", type: "text", required: true },
          { key: "tanggal_lahir", label: "Tanggal Lahir", type: "date", required: true },
          { key: "agama", label: "Agama", type: "text", required: false },
          { key: "pendidikan", label: "Pendidikan", type: "text", required: false },
          { key: "pekerjaan", label: "Pekerjaan", type: "text", required: false },
          { key: "golongan_darah", label: "Golongan Darah", type: "text", required: false },
          { key: "status_perkawinan", label: "Status Perkawinan", type: "text", required: false },
          { key: "tanggal_perkawinan", label: "Tanggal Perkawinan", type: "date", required: false },
          { key: "status_hubungan", label: "Status Hubungan dalam Keluarga", type: "text", required: false },
          { key: "kewarganegaraan", label: "Kewarganegaraan", type: "text", required: false },
          { key: "no_paspor", label: "No. Paspor", type: "text", required: false },
          { key: "no_kitap", label: "No. KITAP", type: "text", required: false },
          { key: "nama_ayah", label: "Nama Ayah", type: "text", required: false },
          { key: "nama_ibu", label: "Nama Ibu", type: "text", required: false },
        ],
      },
    ],
  },
];

async function main() {
  console.log("Seeding jenis surat...");
  for (const js of JENIS_SURAT) {
    await prisma.jenisSurat.upsert({
      where: { kode: js.kode },
      create: {
        kode: js.kode,
        nama: js.nama,
        formatNomor: js.formatNomor,
        templateDokumen: js.templateDokumen,
        skemaField: js.skemaField as unknown as Prisma.InputJsonValue,
      },
      update: {
        nama: js.nama,
        formatNomor: js.formatNomor,
        templateDokumen: js.templateDokumen,
        skemaField: js.skemaField as unknown as Prisma.InputJsonValue,
      },
    });
  }

  console.log("Seeding user admin default...");
  const hashedPassword = await bcrypt.hash(PASSWORD_ADMIN_DEFAULT, 10);
  await prisma.user.upsert({
    where: { email: "admin@desa.id" },
    create: {
      email: "admin@desa.id",
      nama: "Admin Desa",
      password: hashedPassword,
      role: "ADMIN",
    },
    update: {
      password: hashedPassword, // pastikan re-seed selalu sinkron dengan password default
    },
  });

  console.log("");
  console.log("=== Login default ===");
  console.log("Email    : admin@desa.id");
  console.log(`Password : ${PASSWORD_ADMIN_DEFAULT}`);
  console.log("(Segera ganti password ini kalau sudah dipakai produksi.)");
  console.log("");

  console.log("Selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
