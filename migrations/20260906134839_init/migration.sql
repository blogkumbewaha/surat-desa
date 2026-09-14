-- CreateEnum
CREATE TYPE "RoleStaff" AS ENUM ('OPERATOR', 'SEKRETARIS', 'KEPALA_DESA', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusPengajuan" AS ENUM ('DIAJUKAN', 'DIPROSES', 'DISETUJUI', 'DITOLAK', 'DICETAK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "RoleStaff" NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warga" (
    "id" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "noKK" TEXT,
    "nama" TEXT NOT NULL,
    "tempatLahir" TEXT,
    "tanggalLahir" TIMESTAMP(3),
    "jenisKelamin" TEXT,
    "agama" TEXT,
    "statusPerkawinan" TEXT,
    "pekerjaan" TEXT,
    "kewarganegaraan" TEXT NOT NULL DEFAULT 'WNI',
    "alamat" TEXT,
    "rt" TEXT,
    "rw" TEXT,
    "noHp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenis_surat" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "formatNomor" TEXT NOT NULL,
    "skemaField" JSONB NOT NULL,
    "templateDokumen" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jenis_surat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counter_nomor_surat" (
    "id" TEXT NOT NULL,
    "jenisSuratId" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "counterTerakhir" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "counter_nomor_surat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pengajuan_surat" (
    "id" TEXT NOT NULL,
    "nomorSurat" TEXT,
    "jenisSuratId" TEXT NOT NULL,
    "wargaId" TEXT,
    "namaPemohon" TEXT,
    "nikPemohon" TEXT,
    "dataForm" JSONB NOT NULL,
    "status" "StatusPengajuan" NOT NULL DEFAULT 'DIAJUKAN',
    "catatan" TEXT,
    "dibuatOlehId" TEXT NOT NULL,
    "diprosesOlehId" TEXT,
    "tanggalDiajukan" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalDiproses" TIMESTAMP(3),
    "tanggalDicetak" TIMESTAMP(3),
    "kodeVerifikasi" TEXT,

    CONSTRAINT "pengajuan_surat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "warga_nik_key" ON "warga"("nik");

-- CreateIndex
CREATE INDEX "warga_nik_idx" ON "warga"("nik");

-- CreateIndex
CREATE INDEX "warga_nama_idx" ON "warga"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "jenis_surat_kode_key" ON "jenis_surat"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "counter_nomor_surat_jenisSuratId_tahun_key" ON "counter_nomor_surat"("jenisSuratId", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "pengajuan_surat_nomorSurat_key" ON "pengajuan_surat"("nomorSurat");

-- CreateIndex
CREATE UNIQUE INDEX "pengajuan_surat_kodeVerifikasi_key" ON "pengajuan_surat"("kodeVerifikasi");

-- CreateIndex
CREATE INDEX "pengajuan_surat_status_idx" ON "pengajuan_surat"("status");

-- CreateIndex
CREATE INDEX "pengajuan_surat_jenisSuratId_idx" ON "pengajuan_surat"("jenisSuratId");

-- AddForeignKey
ALTER TABLE "counter_nomor_surat" ADD CONSTRAINT "counter_nomor_surat_jenisSuratId_fkey" FOREIGN KEY ("jenisSuratId") REFERENCES "jenis_surat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan_surat" ADD CONSTRAINT "pengajuan_surat_jenisSuratId_fkey" FOREIGN KEY ("jenisSuratId") REFERENCES "jenis_surat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan_surat" ADD CONSTRAINT "pengajuan_surat_wargaId_fkey" FOREIGN KEY ("wargaId") REFERENCES "warga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan_surat" ADD CONSTRAINT "pengajuan_surat_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pengajuan_surat" ADD CONSTRAINT "pengajuan_surat_diprosesOlehId_fkey" FOREIGN KEY ("diprosesOlehId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
