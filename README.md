```markdown
# Sistem Surat Desa

Aplikasi otomasi surat desa (12 jenis surat) dengan alur pengajuan → persetujuan →
cetak (Word/Excel), dibangun dengan Next.js (App Router) + PostgreSQL + Prisma.

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

## Template Surat (folder `templates/`)

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

## Alur Pemakaian End-to-End

1. **Login**
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
```
