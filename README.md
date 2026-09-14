# Sistem Surat Desa

Aplikasi otomasi administrasi dan pelayanan 12 jenis surat desa dengan alur kerja terintegrasi: **Pengajuan ➔ Persetujuan ➔ Pencetakan**. 

Sistem ini dirancang menggunakan arsitektur modern berbasis **Next.js (App Router)**, **PostgreSQL**, dan **Prisma ORM**.

---

## Struktur Proyek

```text
src/
├── app/
│   ├── login/                      # Halaman autentikasi utama (cek email & password)
│   ├── (dashboard)/                # Area internal staf desa (wajib login)
│   │   ├── layout.tsx              # Sidebar, profil user, & tombol logout
│   │   ├── dashboard/              # Panel ringkasan & statistik surat
│   │   ├── pengajuan-surat/
│   │   │   ├── page.tsx            # Daftar dan monitoring pengajuan surat
│   │   │   ├── baru/
│   │   │   │   ├── page.tsx        # Form pengajuan baru (form field dinamis)
│   │   │   │   └── FieldTabel.tsx  # Sub-form tabel dinamis (mis. Anggota KK)
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Detail pengajuan & kontrol cetak dokumen
│   │   │       └── AksiPengajuan.tsx# Client component tombol aksi (RBAC)
│   │   ├── warga/page.tsx          # Manajemen master data warga desa
│   │   ├── jenis-surat/
│   │   │   ├── page.tsx            # Konfigurasi field surat & counter nomor urut
│   │   │   └── AturCounter.tsx     # Panel kontrol nomor urut (Admin Only)
│   │   └── pengguna/page.tsx       # Manajemen akun & hak akses staf (Admin Only)
│   └── api/                        # Endpoint REST API backend terproteksi
│       ├── auth/                   # Endpoint login & logout (Session Cookie)
│       ├── users/                  # CRUD pengelolaan data pengguna (Admin Only)
│       ├── pengajuan-surat/        # Engine CRUD, persetujuan, & generate dokumen
│       ├── jenis-surat/            # Pengaturan metadata format surat
│       └── warga/                  # Pencarian otomatis & manajemen warga
├── lib/                            # Modul utilitas & core bisnis logic
│   ├── session.ts                  # Manajemen JWT session & server-side verification
│   ├── auth-guard.ts               # Helper otorisasi berbasis peran (RBAC)
│   ├── prisma.ts                   # Instance singleton Prisma Client
│   ├── nomor-surat.ts              # Generator nomor surat otomatis berbasis kode
│   ├── generate-dokumen.ts         # Engine pengisi data ke template .docx
│   ├── generate-dokumen-xlsx.ts    # Engine pengisi koordinat sel template .xlsx (Form KK)
│   ├── convert-pdf.ts              # Driver konversi dokumen ke PDF (LibreOffice)
│   └── format.ts                   # Utility parsing & lokalisasi tanggal Indonesia
├── middleware.ts                   # Gatekeeper rute global (Proteksi & Redirect)
├── prisma/                         # Konfigurasi database relasional
│   ├── schema.prisma               # Definisi skema basis data
│   └── seed.ts                     # Seeder master jenis surat & akun admin
└── templates/                      # Direktori 12 berkas template dinamis (.docx & .xlsx)
```

---

## Inventaris Template Surat (`templates/`)

Sistem mengotomatisasi pencetakan berkas template menggunakan placeholder variabel `{field_name}` dengan format berkas berikut:

| Nama Berkas | Jenis Pelayanan Surat | Kode Klasifikasi |
| :--- | :--- | :---: |
| `suket-kenal-lahir.docx` | Surat Keterangan Kenal Lahir | `SKL` |
| `pengantar-permohonan-izin-keramaian.docx` | Pengantar Permohonan Izin Keramaian | `SPIK` |
| `suket-berkelakuan-baik.docx` | Surat Keterangan Berkelakuan Baik | `SKBB` |
| `suket-domisili.docx` | Surat Keterangan Domisili | `SKD` |
| `suket-kematian.docx` | Surat Keterangan Kematian & Pemakaman | `SKK` |
| `suket-penghasilan.docx` | Surat Keterangan Penghasilan | `SKPH` |
| `suket-telah-menikah.docx` | Surat Keterangan Telah Menikah | `SKTMK` |
| `suket-tidak-berada-ditempat.docx` | Surat Keterangan Tidak Berada di Tempat | `SKTBD` |
| `suket-tidak-mampu.docx` | Surat Keterangan Tidak Mampu | `SKTM` |
| `suket-usaha.docx` | Surat Keterangan Usaha | `SKU` |
| `formulir-pengantar-nikah.docx` | Formulir Pengantar Nikah (Model N1-N5 KUA) | `NIKAH` |
| `formulir-kk.xlsx` | Formulir Pengantar Kartu Keluarga (KK) | `FKK` |

---

## Alur Pemakaian Sistem (End-to-End)

1. **Autentikasi** ➔ Staf masuk menggunakan akun masing-masing melalui halaman `/login`.
2. **Pengisian Formulir** ➔ Navigasi ke `/pengajuan-surat/baru` ➔ Pilih Jenis Surat.
   * *Fitur Smart-Fill:* Cari nama warga untuk pengisian otomatis, atau isi manual "Data Pemohon" (NIK, Nama, TTL, Alamat, Pekerjaan).
   * *Mekanisme Upsert:* Data pemohon akan otomatis di-*upsert* ke tabel `Warga` berdasarkan NIK. Jika data sudah ada, sistem akan memperbarui profilnya secara otomatis.
3. **Validasi & Verifikasi** ➔ Pemeriksa membuka detail pengajuan di `/pengajuan-surat/[id]` untuk menyetujui atau menolak permohonan.
4. **Penomoran Otomatis** ➔ Begitu status berubah menjadi **DISETUJUI**, sistem langsung men-generate nomor surat unik sesuai format klasifikasi desa.
5. **Pencetakan** ➔ Tombol unduh berkas aktif. Dokumen terunduh dalam kondisi data terisi sempurna dan siap dicetak untuk tanda tangan fisik.

---

## Matriks Hak Akses & Peran (RBAC)

Sistem membatasi fitur berdasarkan peran yang dimiliki pengguna demi menjaga validitas dokumen data desa:

| Hak Akses / Fitur | OPERATOR | SEKRETARIS | KEPALA_DESA | ADMIN |
| :--- | :---: | :---: | :---: | :---: |
| Input & Ajukan Surat | ✅ | ✅ | ✅ | ✅ |
| Setujui / Tolak Pengajuan | ❌ | ✅ | ✅ | ✅ |
| Hapus Riwayat Pengajuan | ❌ | ❌ | ❌ | ✅ |
| Konfigurasi & Counter Surat | ❌ | ❌ | ❌ | ✅ |
| Manajemen Akun Pengguna | ❌ | ❌ | ❌ | ✅ |

*Catatan: Modul pengelolaan akun hanya dapat diakses oleh pemilik peran **ADMIN** melalui menu **Pengguna** yang tertera pada sidebar dashboard.*
