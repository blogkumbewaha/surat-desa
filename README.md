# Sistem Surat Desa

Aplikasi otomasi surat desa (11 jenis surat) dengan alur pengajuan → persetujuan →
cetak (Word & PDF), dibangun dengan Next.js (App Router) + PostgreSQL + Prisma.

## ⚠️ PENTING kalau kamu upgrade dari versi proyek sebelumnya

Folder `prisma/migrations` **tidak disertakan** di paket ini. Kalau kamu sudah
pernah menjalankan `npx prisma migrate dev` sebelumnya dan punya folder
`prisma/migrations` isi migrasi yang berhasil di proyek lama:

1. **Copy folder `prisma/migrations` dari proyek lama** ke tempat aman dulu
2. Baru extract/timpa dengan proyek baru ini
3. **Taruh kembali folder `prisma/migrations`** yang tadi di-copy, ke lokasi yang sama
4. Copy juga file `.env` kamu yang lama (isi `DATABASE_URL`) ke proyek baru

Kalau tidak, Prisma akan mendeteksi "drift" lagi (database sudah ada isi tapi
riwayat migrasi lokal hilang) dan minta reset database dari nol.

## Login Default

Setelah `npm run db:seed`, akun admin default:

```
Email    : admin@desa.id
Password : admin123
```

**Segera ganti password ini** kalau sistem sudah mulai dipakai sungguhan
(lewat Prisma Studio, update kolom `password` dengan hash bcrypt baru).

## Struktur Proyek

```
src/
  middleware.ts           # proteksi semua halaman & API, redirect ke /login kalau belum masuk
  app/
    login/                 # halaman login (fungsional, cek email+password ke database)
    (dashboard)/            # halaman internal staf desa (wajib login)
      layout.tsx             # sidebar + info user login + tombol keluar
      dashboard/              # ringkasan statistik
      pengajuan-surat/
        page.tsx                # daftar semua pengajuan
        baru/page.tsx           # form buat pengajuan baru (field dinamis sesuai jenis surat)
        [id]/page.tsx           # detail + tombol Setujui/Tolak/Unduh Word/Unduh PDF
        [id]/AksiPengajuan.tsx  # client component tombol aksi
      warga/page.tsx          # daftar + tambah data warga
      jenis-surat/page.tsx     # daftar jenis surat & field-nya
    api/
      auth/login, auth/logout     # login & logout (set/hapus session cookie)
      pengajuan-surat/             # CRUD + setujui/tolak/cetak
      jenis-surat/                  # list & create jenis surat
      warga/                         # cari/list & create warga
  lib/
    session.ts             # buat & verifikasi JWT session, baca session di server component
    prisma.ts               # Prisma client singleton
    nomor-surat.ts            # generator nomor surat otomatis
    generate-dokumen.ts        # render template docx + data pengajuan -> buffer docx
    convert-pdf.ts               # convert buffer docx -> pdf pakai LibreOffice
    format.ts                     # format tanggal Indonesia, parsing komponen nomor surat
    types.ts                       # tipe FieldSurat (skema field dinamis)
templates/                # 11 file .docx template dengan placeholder {field_name}
prisma/
  schema.prisma            # skema database
  seed.ts                  # 11 jenis surat + akun admin default
```

## Setup dari Nol

1. Install dependencies:
   ```bash
   npm install
   ```

2. Salin `.env.example` ke `.env`, isi:
   - `DATABASE_URL` — koneksi PostgreSQL (Neon, Supabase, dll)
   - `AUTH_SECRET` — string acak untuk sign session JWT (`openssl rand -base64 32`)

3. Generate Prisma client & migrasi:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. Isi data awal (11 jenis surat + akun admin):
   ```bash
   npm run db:seed
   ```

5. Jalankan development server:
   ```bash
   npm run dev
   ```

6. Buka http://localhost:3000, login dengan `admin@desa.id` / `admin123`

## Fitur Cetak PDF — Perlu LibreOffice

Unduh Word (.docx) langsung jalan tanpa syarat tambahan. Untuk **unduh PDF**,
server butuh LibreOffice terpasang:

- **macOS**: `brew install --cask libreoffice`
- **Linux**: `sudo apt install libreoffice` (atau setara)
- **Windows**: download dari [libreoffice.org](https://www.libreoffice.org/)

Kalau LibreOffice ada di lokasi tidak umum, set env var `LIBREOFFICE_PATH` di
`.env` ke path binary `soffice`-nya. Kalau belum sempat install, tombol
"Unduh Word (.docx)" tetap berfungsi normal sebagai alternatif.

## Template Surat (folder `templates/`)

11 jenis surat, semua sudah diisi placeholder docxtemplater (format
`{nama_field}`), field-nya cocok 1:1 dengan `skemaField` di `prisma/seed.ts`:

| File | Jenis Surat | Kode |
|---|---|---|
| `suket-kenal-lahir.docx` | Surat Keterangan Kenal Lahir | SKL |
| `pengantar-permohonan-izin-keramaian.docx` | Pengantar Permohonan Izin Keramaian | SPIK |
| `suket-berkelakuan-baik.docx` | Surat Keterangan Berkelakuan Baik | SKBB |
| `suket-domisili.docx` | Surat Keterangan Domisili | SKD |
| `suket-kematian.docx` | Surat Keterangan Kematian (+ Pemakaman) | SKK |
| `suket-penghasilan.docx` | Surat Keterangan Penghasilan | SKPH |
| `suket-telah-menikah.docx` | Surat Keterangan Telah Menikah | SKTMK |
| `suket-tidak-berada-ditempat.docx` | Surat Keterangan Tidak Berada di Tempat | SKTBD |
| `suket-tidak-mampu.docx` | Surat Keterangan Tidak Mampu | SKTM |
| `suket-usaha.docx` | Surat Keterangan Usaha | SKU |
| `formulir-pengantar-nikah.docx` | Formulir Pengantar Nikah (Model N1-N5, KUA) | NIKAH |

⚠️ **Catatan `formulir-pengantar-nikah.docx`**: berisi 5 model surat KUA
berbeda (N-1 s/d N-5) dalam satu dokumen. Model N-1, N-2, N-4 harusnya punya
nomor surat sendiri-sendiri, tapi saat ini semuanya memakai nomor yang sama
(solusi sementara di `generate-dokumen.ts`) — perlu logika penomoran terpisah
kalau mau dipakai serius untuk jenis surat ini.

## Alur Pemakaian End-to-End (sudah ditest semua)

1. **Login** → `admin@desa.id` / `admin123`
2. **Buat pengajuan** → `/pengajuan-surat/baru` → pilih jenis surat → cari
   warga (opsional, buat auto-isi) → isi/edit "Data Pemohon" (Nama, NIK,
   Tempat/Tanggal Lahir, Jenis Kelamin, Pekerjaan, Alamat) → isi field
   tambahan spesifik jenis surat kalau ada → Ajukan
   - Data Pemohon ini **selalu di-upsert ke tabel Warga berdasarkan NIK** —
     kalau NIK sudah pernah tercatat, datanya diperbarui (mis. ganti
     pekerjaan); kalau belum, dibuat baru. Jadi pengajuan berikutnya oleh
     orang yang sama tinggal cari namanya, dan datanya sudah paling baru.
3. **Lihat & proses** → `/pengajuan-surat` → klik Detail → tombol Setujui/Tolak
4. **Setujui** → nomor surat otomatis dibuat (format sesuai kode klasifikasi asli)
5. **Unduh surat** → tombol "Unduh Word (.docx)" atau "Unduh PDF" muncul,
   dokumen sudah terisi otomatis, siap print (tanda tangan & stempel manual)

## Yang Masih Perlu Dikerjakan (TODO)

- [ ] **Halaman kelola Jenis Surat dari UI** — saat ini cuma bisa lihat daftar,
      tambah/edit jenis surat baru masih lewat `prisma/seed.ts` langsung
      (API `POST /api/jenis-surat` sudah ada, tinggal buat form-nya)
- [ ] **Role-based access** — saat ini semua user yang login bisa
      setujui/tolak/input; belum dibedakan OPERATOR vs SEKRETARIS vs KEPALA_DESA
- [ ] **Logika penomoran khusus untuk `formulir-pengantar-nikah`** (lihat catatan di atas)
- [ ] **Fitur ubah password** dari UI (saat ini cuma bisa lewat Prisma Studio)
- [ ] **Halaman manajemen user** (tambah operator/sekdes baru dari UI)
- [ ] **Verifikasi QR publik** — sudah disiapkan field `kodeVerifikasi` di
      database, tinggal dibuat halaman publik & QR code-nya kalau dibutuhkan nanti
