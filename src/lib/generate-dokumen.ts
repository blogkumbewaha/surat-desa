import path from "path";
import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { prisma } from "@/lib/prisma";
import { formatTanggalIndonesia, parseNomorSuratComponents } from "@/lib/format";
import { isiFormulirKK, type AnggotaKeluarga } from "@/lib/generate-dokumen-xlsx";

// Info wilayah statis untuk formulir KK — selalu sama, jadi tidak perlu
// diketik ulang tiap kali mengajukan (sama seperti nama desa di kop surat
// template Word lainnya).
const WILAYAH_DESA = "Kumbewaha";
const WILAYAH_KECAMATAN = "Siotapina";
const WILAYAH_KABUPATEN = "Buton";
const WILAYAH_PROVINSI = "Sulawesi Tenggara";

export class GenerateDokumenError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Ambil data pengajuan, render template-nya (docx ATAU xlsx, dideteksi dari
 * ekstensi file), dan kembalikan buffer siap diunduh + nama file yang
 * disarankan (tanpa ekstensi — pemanggil yang menambahkan .docx/.xlsx/.pdf).
 * Melempar GenerateDokumenError kalau pengajuan belum disetujui / template
 * tidak ada / render gagal.
 */
export async function generateDokumenSurat(pengajuanId: string) {
  const pengajuan = await prisma.pengajuanSurat.findUnique({
    where: { id: pengajuanId },
    include: { jenisSurat: true, warga: true },
  });

  if (!pengajuan) {
    throw new GenerateDokumenError("Pengajuan tidak ditemukan", 404);
  }
  if (!pengajuan.nomorSurat || !pengajuan.tanggalDiproses) {
    throw new GenerateDokumenError("Surat belum disetujui, belum ada nomor surat", 400);
  }
  if (!pengajuan.jenisSurat.templateDokumen) {
    throw new GenerateDokumenError("Jenis surat ini belum punya template dokumen", 400);
  }

  const templatePath = path.join(
    process.cwd(),
    "templates",
    pengajuan.jenisSurat.templateDokumen
  );
  if (!fs.existsSync(templatePath)) {
    throw new GenerateDokumenError(
      `File template tidak ditemukan: ${pengajuan.jenisSurat.templateDokumen}`,
      500
    );
  }

  const ekstensi = path.extname(pengajuan.jenisSurat.templateDokumen).toLowerCase();
  const nomorComponents = parseNomorSuratComponents(
    pengajuan.jenisSurat.formatNomor,
    pengajuan.nomorSurat
  );
  const tanggalSurat = formatTanggalIndonesia(pengajuan.tanggalDiproses);
  const dataForm = pengajuan.dataForm as Record<string, unknown>;
  const filename = `${pengajuan.jenisSurat.kode}-${pengajuan.nomorSurat.replace(/\//g, "-")}`;

  let buffer: Buffer;

  if (ekstensi === ".xlsx") {
    // Sejauh ini cuma "Formulir Pengantar KK" yang xlsx — mapping cell-nya
    // ada di generate-dokumen-xlsx.ts, spesifik untuk struktur file itu.
    const templateBuffer = fs.readFileSync(templatePath);
    try {
      buffer = await isiFormulirKK(templateBuffer, {
        nomorSuratLengkap: `Nomor     :     ${pengajuan.nomorSurat}`,
        namaKepalaKeluarga: String(dataForm.nama_kepala_keluarga ?? ""),
        alamat: String(dataForm.alamat ?? ""),
        rtRw: dataForm.rt_rw ? String(dataForm.rt_rw) : undefined,
        kodePos: dataForm.kode_pos ? String(dataForm.kode_pos) : undefined,
        desa: WILAYAH_DESA,
        kecamatan: WILAYAH_KECAMATAN,
        kabupaten: WILAYAH_KABUPATEN,
        provinsi: WILAYAH_PROVINSI,
        nomorKKLama: dataForm.nomor_kk_lama ? String(dataForm.nomor_kk_lama) : undefined,
        tanggalSurat,
        anggotaKeluarga: (dataForm.anggota_keluarga as AnggotaKeluarga[]) || [],
      });
    } catch (error) {
      console.error("Gagal render dokumen xlsx:", error);
      throw new GenerateDokumenError("Gagal mengisi template Excel.", 500);
    }
  } else {
    const templateData: Record<string, unknown> = {
      ...dataForm,
      nomor_urut: nomorComponents?.nomor_urut ?? "",
      bulan_romawi: nomorComponents?.bulan_romawi ?? "",
      tahun: nomorComponents?.tahun ?? "",
      tanggal_surat: tanggalSurat,
    };

    // Lihat catatan di prisma/seed.ts soal formulir-pengantar-nikah (5 sub-model)
    for (const prefix of ["n1", "n2", "n3", "n4", "n5"]) {
      templateData[`${prefix}_tanggal_surat`] ??= tanggalSurat;
      templateData[`${prefix}_nomor_urut`] ??= nomorComponents?.nomor_urut ?? "";
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => "",
    });

    try {
      doc.render(templateData);
    } catch (error) {
      console.error("Gagal render dokumen:", error);
      throw new GenerateDokumenError(
        "Gagal mengisi template dokumen. Cek kesesuaian field di skemaField.",
        500
      );
    }

    buffer = doc.getZip().generate({ type: "nodebuffer" });
  }

  // Tandai sebagai sudah dicetak (kalau ini pertama kali)
  if (pengajuan.status !== "DICETAK") {
    await prisma.pengajuanSurat.update({
      where: { id: pengajuanId },
      data: { status: "DICETAK", tanggalDicetak: new Date() },
    });
  }

  return { buffer, filename, pengajuan, ekstensiAsli: ekstensi };
}
