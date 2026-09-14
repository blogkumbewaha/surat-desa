import ExcelJS from "exceljs";

export interface AnggotaKeluarga {
  nama?: string;
  nik?: string;
  jenis_kelamin?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  agama?: string;
  pendidikan?: string;
  pekerjaan?: string;
  golongan_darah?: string;
  status_perkawinan?: string;
  tanggal_perkawinan?: string;
  status_hubungan?: string;
  kewarganegaraan?: string;
  no_paspor?: string;
  no_kitap?: string;
  nama_ayah?: string;
  nama_ibu?: string;
}

/**
 * Isi template formulir-kk.xlsx dengan data pemohon + daftar anggota keluarga.
 * Koordinat cell ini cocok dengan struktur asli formulir-kk.xlsx — kalau
 * template-nya diganti/didesain ulang, mapping di bawah perlu disesuaikan lagi.
 */
export async function isiFormulirKK(
  templateBuffer: Buffer,
  data: {
    nomorSuratLengkap: string; // sudah termasuk "Nomor     :     ..." lengkap
    namaKepalaKeluarga: string;
    alamat: string;
    rtRw?: string;
    kodePos?: string;
    desa?: string;
    kecamatan?: string;
    kabupaten?: string;
    provinsi?: string;
    nomorKKLama?: string;
    tanggalSurat: string; // "24 Agustus 2026"
    anggotaKeluarga: AnggotaKeluarga[];
  }
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer as unknown as ArrayBuffer);
  const ws = workbook.worksheets[0];

  ws.getCell("A3").value = data.nomorSuratLengkap;
  ws.getCell("K5").value = data.namaKepalaKeluarga;
  ws.getCell("K6").value = data.alamat;
  ws.getCell("K7").value = data.rtRw || "";
  ws.getCell("K8").value = data.kodePos || "";
  ws.getCell("R7").value = data.nomorKKLama || "";
  ws.getCell("AC5").value = data.desa || "";
  ws.getCell("AC6").value = data.kecamatan || "";
  ws.getCell("AC7").value = data.kabupaten || "";
  ws.getCell("AC8").value = data.provinsi || "";

  const anggota = data.anggotaKeluarga.slice(0, 10); // template cuma sedia 10 baris
  anggota.forEach((a, i) => {
    const rowBiodata = 14 + i;
    ws.getCell(`B${rowBiodata}`).value = a.nama || "";
    ws.getCell(`I${rowBiodata}`).value = a.nik || "";
    ws.getCell(`L${rowBiodata}`).value = a.jenis_kelamin || "";
    ws.getCell(`P${rowBiodata}`).value = a.tempat_lahir || "";
    ws.getCell(`R${rowBiodata}`).value = a.tanggal_lahir || "";
    ws.getCell(`S${rowBiodata}`).value = a.agama || "";
    ws.getCell(`V${rowBiodata}`).value = a.pendidikan || "";
    ws.getCell(`AD${rowBiodata}`).value = a.pekerjaan || "";
    ws.getCell(`AG${rowBiodata}`).value = a.golongan_darah || "";

    const rowDetail = 28 + i;
    ws.getCell(`A${rowDetail}`).value = i + 1;
    ws.getCell(`C${rowDetail}`).value = a.status_perkawinan || "";
    ws.getCell(`F${rowDetail}`).value = a.tanggal_perkawinan || "";
    ws.getCell(`J${rowDetail}`).value = a.status_hubungan || "";
    ws.getCell(`O${rowDetail}`).value = a.kewarganegaraan || "";
    ws.getCell(`Q${rowDetail}`).value = a.no_paspor || "";
    ws.getCell(`R${rowDetail}`).value = a.no_kitap || "";
    ws.getCell(`T${rowDetail}`).value = a.nama_ayah || "";
    ws.getCell(`AE${rowDetail}`).value = a.nama_ibu || "";
  });

  ws.getCell("Y41").value = `            Kumbewaha, ${data.tanggalSurat}`;
  ws.getCell("D47").value = data.namaKepalaKeluarga;

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
