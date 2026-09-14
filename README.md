```markdown
# Sistem Surat Desa

Aplikasi otomasi surat desa (12 jenis surat) dengan alur pengajuan → persetujuan →
cetak (Word/Excel & PDF), dibangun dengan Next.js (App Router) + PostgreSQL + Prisma.

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
  middleware.ts           # proteksi semua halaman & API + batasi rute admin, redirect ke /login kalau belum masuk
  app/
    login/                 # halaman login (fungsional, cek email+password ke database)
    (dashboard)/            # halaman internal staf desa (wajib login)
      layout.tsx             # sidebar + info user login + tombol keluar
      dashboard/              # ringkasan statistik
      pengajuan-surat/
        page.tsx                # daftar semua pengajuan
        baru/page.tsx           # form buat pengajuan baru (field dinamis sesuai jenis surat)
        baru/FieldTabelDinamis.tsx  # sub-form tabel dinamis (mis. anggota keluarga di formulir KK)
        [id]/page.tsx           # detail + tombol Setujui/Tolak/Unduh Word-Excel/Unduh PDF
        [id]/AksiPengajuan.tsx  # client component tombol aksi (disesuaikan per role)
      warga/page.tsx          # daftar + tambah + edit data warga
      jenis-surat/page.tsx     # daftar jenis surat, field-nya, dan atur nomor urut terakhir
      jenis-surat/AturCounter.tsx  # sub-component atur nomor urut terakhir (admin only)
      pengguna/page.tsx        # kelola akun & peran user (admin only)
    api/
      auth/login, auth/logout     # login & logout (set/hapus session cookie)
      users/                        # list, buat, ubah peran/status user (admin only)
      pengajuan-surat/             # CRUD + setujui/tolak/cetak (dibatasi per peran)
      jenis-surat/                  # list & create jenis surat
      jenis-surat/[id]/counter/      # lihat & set nomor urut terakhir per jenis surat
      warga/                         # cari/list & create/update warga
  lib/
    session.ts             # buat & verifikasi JWT session, baca session di server component
    auth-guard.ts            # helper cek peran (role-based access)
    prisma.ts               # Prisma client singleton
    nomor-surat.ts            # generator nomor surat otomatis
    generate-dokumen.ts        # render template docx + data pengajuan -> buffer docx
    generate-dokumen-xlsx.ts     # khusus formulir KK: isi template xlsx per koordinat sel
    convert-pdf.ts               # convert buffer docx/xlsx -> pdf pakai LibreOffice
    format.ts                     # format tanggal Indonesia, parsing komponen nomor surat
    jenis-kelamin.ts                # konversi label <-> kode Jenis Kelamin (L/P)
    types.ts                       # tipe FieldSurat (skema field dinamis, termasuk tipe "table")
templates/                # 12 file template (.docx & .xlsx) dengan placeholder {field_name}
prisma/
  schema.prisma            # skema database
  seed.ts                  # 12 jenis surat + akun admin default
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

4. Isi data awal (12 jenis surat + akun admin):
   ```bash
   npm run db:seed
   ```

5. Jalankan development server:
   ```bash
   npm run dev
   ```

6. Buka http://localhost:3000, login dengan `admin@desa.id` / `admin123`

## Fitur Cetak PDF — Perlu LibreOffice

Unduh Word/Excel langsung jalan tanpa syarat tambahan. Untuk **unduh PDF**,
server butuh LibreOffice terpasang:

- **macOS**: `brew install --cask libreoffice`
- **Linux**: `sudo apt install libreoffice` (atau setara)
- **Windows**: download dari [libreoffice.org](https://www.libreoffice.org/)

Kalau LibreOffice ada di lokasi tidak umum, set env var `LIBREOFFICE_PATH` di
`.env` ke path binary `soffice`-nya. Kalau belum sempat install, tombol
"Unduh Word/Excel" tetap berfungsi normal sebagai alternatif.

## Template Surat (folder `templates/`)

12 jenis surat. 11 di antaranya format Word (.docx) dengan placeholder
docxtemplater (`{nama_field}`); 1 (formulir KK) format Excel (.xlsx) yang
diisi langsung per koordinat sel lewat `generate-dokumen-xlsx.ts`. Field-nya
cocok 1:1 dengan `skemaField` di `prisma/seed.ts`:

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
| `formulir-kk.xlsx` | Formulir Pengantar Kartu Keluarga (KK) | FKK |

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
   (khusus peran SEKRETARIS/KEPALA_DESA/ADMIN — OPERATOR cuma bisa lihat)
4. **Setujui** → nomor surat otomatis dibuat (format sesuai kode klasifikasi asli)
5. **Unduh surat** → tombol "Unduh Word/Excel" atau "Unduh PDF" muncul,
   dokumen sudah terisi otomatis, siap print (tanda tangan & stempel manual)

## Peran & Akses

| Aksi | OPERATOR | SEKRETARIS | KEPALA_DESA | ADMIN |
|---|---|---|---|---|
| Input pengajuan surat | ✅ | ✅ | ✅ | ✅ |
| Setujui / Tolak surat | ❌ | ✅ | ✅ | ✅ |
| Hapus pengajuan | ❌ | ❌ | ❌ | ✅ |
| Kelola jenis surat & nomor urut | ❌ | ❌ | ❌ | ✅ |
| Kelola pengguna | ❌ | ❌ | ❌ | ✅ |

Kelola pengguna & peran lewat halaman **Pengguna** (muncul di sidebar khusus
akun ADMIN).

## Yang Masih Perlu Dikerjakan (TODO)

- [ ] **Halaman tambah/edit Jenis Surat dari UI** — saat ini cuma bisa lihat
      daftar & atur nomor urut; tambah/edit jenis surat baru masih lewat
      `prisma/seed.ts` langsung (API `POST /api/jenis-surat` sudah ada,
      tinggal buat form-nya)
- [ ] **Logika penomoran khusus untuk `formulir-pengantar-nikah`** (5 model
      surat, harusnya 3 nomor surat berbeda — lihat catatan di atas)
- [ ] **Fitur reset password dari UI** — API-nya sudah ada
      (`PATCH /api/users/:id` menerima `passwordBaru`), tinggal ditambah
      tombolnya di halaman Pengguna
- [ ] **Verifikasi QR publik** — sudah disiapkan field `kodeVerifikasi` di
      database, tinggal dibuat halaman publik & QR code-nya kalau dibutuhkan nanti

### Sudah selesai (dulu ada di TODO)
- [x] Role-based access (OPERATOR/SEKRETARIS/KEPALA_DESA/ADMIN, dicek di
      server lewat `src/lib/auth-guard.ts` + middleware)
- [x] Halaman manajemen user (`/pengguna`, admin only)
```