import fs from "fs";
import { isiFormulirKK } from "./src/lib/generate-dokumen-xlsx";

async function main() {
  const templateBuffer = fs.readFileSync("templates/formulir-kk.xlsx");
  const buffer = await isiFormulirKK(templateBuffer, {
    nomorSuratLengkap: "Nomor     :     400.10.2 / 015 / PDK / IX / 2026",
    namaKepalaKeluarga: "Budi Santoso",
    alamat: "Dusun Kanawa I RT01/RW01",
    rtRw: "001/001",
    kodePos: "93753",
    desa: "Kumbewaha",
    kecamatan: "Siotapina",
    kabupaten: "Buton",
    provinsi: "Sulawesi Tenggara",
    tanggalSurat: "9 September 2026",
    anggotaKeluarga: [
      {
        nama: "Budi Santoso", nik: "7401234567890001", jenis_kelamin: "Laki-laki",
        tempat_lahir: "Buton", tanggal_lahir: "12 Januari 1985", agama: "Islam",
        pendidikan: "SMA", pekerjaan: "Petani", golongan_darah: "O",
        status_perkawinan: "Kawin", tanggal_perkawinan: "10 Mei 2010",
        status_hubungan: "Kepala Keluarga", kewarganegaraan: "WNI",
        nama_ayah: "Slamet", nama_ibu: "Siti",
      },
      {
        nama: "Siti Aminah", nik: "7401234567890002", jenis_kelamin: "Perempuan",
        tempat_lahir: "Buton", tanggal_lahir: "5 Mei 1987", agama: "Islam",
        pendidikan: "SMP", pekerjaan: "Ibu Rumah Tangga", golongan_darah: "A",
        status_perkawinan: "Kawin", tanggal_perkawinan: "10 Mei 2010",
        status_hubungan: "Istri", kewarganegaraan: "WNI",
        nama_ayah: "Rahmat", nama_ibu: "Aminah",
      },
      {
        nama: "Andi Santoso", nik: "7401234567890003", jenis_kelamin: "Laki-laki",
        tempat_lahir: "Buton", tanggal_lahir: "20 Juni 2012", agama: "Islam",
        pendidikan: "SD", pekerjaan: "Belum/Tidak Bekerja", golongan_darah: "O",
        status_hubungan: "Anak", kewarganegaraan: "WNI",
        nama_ayah: "Budi Santoso", nama_ibu: "Siti Aminah",
      },
    ],
  });
  fs.writeFileSync("/tmp/test-kk-output.xlsx", buffer);
  console.log("OK, ukuran:", buffer.length, "bytes");
}
main();
