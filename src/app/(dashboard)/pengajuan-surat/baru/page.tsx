"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FieldSurat, DataFormPengajuan } from "@/lib/types";
import { formatTanggalIndonesia } from "@/lib/format";
import { keLabelJenisKelamin } from "@/lib/jenis-kelamin";
import FieldTabelDinamis from "./FieldTabelDinamis";

interface JenisSurat {
  id: string;
  kode: string;
  nama: string;
  skemaField: FieldSurat[];
}

interface Warga {
  id: string;
  nik: string;
  nama: string;
  tempatLahir: string | null;
  tanggalLahir: string | null; // ISO string dari API
  jenisKelamin: string | null;
  pekerjaan: string | null;
  alamat: string | null;
}

interface DataPemohon {
  nama: string;
  nik: string;
  tempatLahir: string;
  tanggalLahir: string; // format input date: YYYY-MM-DD
  jenisKelamin: string; // "Laki-laki" | "Perempuan"
  pekerjaan: string;
  alamat: string;
}

const PEMOHON_KOSONG: DataPemohon = {
  nama: "",
  nik: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "",
  pekerjaan: "",
  alamat: "",
};

// 6 field ini sudah punya kotak isian sendiri di bagian "Data Pemohon" di
// bawah, jadi kalau kebetulan juga ada di skemaField jenis surat, tidak perlu
// dirender ulang dari daftar field dinamis (supaya tidak dobel).
const FIELD_SUDAH_ADA_KOTAK_SENDIRI = new Set([
  "nama",
  "nik",
  "tempat_tanggal_lahir",
  "jenis_kelamin",
  "pekerjaan",
  "alamat",
]);

export default function PengajuanBaruPage() {
  const router = useRouter();

  const [daftarJenisSurat, setDaftarJenisSurat] = useState<JenisSurat[]>([]);
  const [jenisSuratId, setJenisSuratId] = useState("");
  const [jenisTerpilih, setJenisTerpilih] = useState<JenisSurat | null>(null);

  const [queryPencarian, setQueryPencarian] = useState("");
  const [hasilPencarian, setHasilPencarian] = useState<Warga[]>([]);
  const [wargaTerhubung, setWargaTerhubung] = useState(false); // true kalau berasal dari hasil pencarian

  const [pemohon, setPemohon] = useState<DataPemohon>(PEMOHON_KOSONG);

  const [dataForm, setDataForm] = useState<DataFormPengajuan>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/jenis-surat?aktif=true")
      .then((res) => res.json())
      .then((res) => setDaftarJenisSurat(res.data));
  }, []);

  useEffect(() => {
    setJenisTerpilih(daftarJenisSurat.find((j) => j.id === jenisSuratId) || null);
    setDataForm({});
  }, [jenisSuratId, daftarJenisSurat]);

  useEffect(() => {
    if (queryPencarian.length < 3) {
      setHasilPencarian([]);
      return;
    }
    const timeout = setTimeout(() => {
      fetch(`/api/warga?q=${encodeURIComponent(queryPencarian)}`)
        .then((res) => res.json())
        .then((res) => setHasilPencarian(res.data || []));
    }, 300);
    return () => clearTimeout(timeout);
  }, [queryPencarian]);

  function pilihDariPencarian(w: Warga) {
    setPemohon({
      nama: w.nama,
      nik: w.nik,
      tempatLahir: w.tempatLahir || "",
      tanggalLahir: w.tanggalLahir ? w.tanggalLahir.slice(0, 10) : "",
      jenisKelamin: keLabelJenisKelamin(w.jenisKelamin) || "",
      pekerjaan: w.pekerjaan || "",
      alamat: w.alamat || "",
    });
    setWargaTerhubung(true);
    setQueryPencarian("");
    setHasilPencarian([]);
  }

  function updatePemohon<K extends keyof DataPemohon>(key: K, value: DataPemohon[K]) {
    setPemohon((p) => ({ ...p, [key]: value }));
    // Begitu ada perubahan manual, tetap dianggap terhubung ke warga yang sama
    // (NIK dipakai sebagai kunci) — nanti disimpan sebagai UPDATE ke data warga
    // tersebut, bukan bikin baru. Baris ini sengaja tidak mengubah wargaTerhubung.
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1) Simpan/update data warga dulu (upsert berdasarkan NIK) — ini yang
      //    membuat data pemohon selalu sinkron, baik pemohon baru maupun
      //    pemohon lama yang datanya baru saja diedit (mis. ganti pekerjaan).
      const resWarga = await fetch("/api/warga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nik: pemohon.nik,
          nama: pemohon.nama,
          tempatLahir: pemohon.tempatLahir || null,
          tanggalLahir: pemohon.tanggalLahir || null,
          jenisKelamin: pemohon.jenisKelamin || null,
          pekerjaan: pemohon.pekerjaan || null,
          alamat: pemohon.alamat || null,
        }),
      });
      if (!resWarga.ok) throw new Error((await resWarga.json()).error);
      const warga = (await resWarga.json()).data as { id: string };

      // 2) Susun dataForm: gabungkan field dinamis khusus jenis surat ini
      //    dengan data pemohon (supaya dokumen hasil cetak tetap terisi).
      const tempatTanggalLahirGabungan =
        pemohon.tempatLahir && pemohon.tanggalLahir
          ? `${pemohon.tempatLahir}, ${formatTanggalIndonesia(new Date(pemohon.tanggalLahir))}`
          : "";

      const dataFormLengkap: DataFormPengajuan = {
        ...dataForm,
        nama: pemohon.nama,
        nik: pemohon.nik,
        tempat_tanggal_lahir: tempatTanggalLahirGabungan,
        jenis_kelamin: pemohon.jenisKelamin,
        pekerjaan: pemohon.pekerjaan,
        alamat: pemohon.alamat,
      };

      // Field bertipe "table" (misal daftar anggota keluarga): format ulang
      // sub-field bertipe date jadi format Indonesia sebelum dikirim.
      for (const field of jenisTerpilih?.skemaField ?? []) {
        if (field.type !== "table") continue;
        const rows = (dataFormLengkap[field.key] as Record<string, string>[]) || [];
        dataFormLengkap[field.key] = rows.map((row) => {
          const rowBaru = { ...row };
          for (const kolom of field.columns || []) {
            if (kolom.type === "date" && rowBaru[kolom.key]) {
              rowBaru[kolom.key] = formatTanggalIndonesia(new Date(rowBaru[kolom.key]));
            }
          }
          return rowBaru;
        });
      }

      // 3) Buat pengajuan surat, terhubung ke warga hasil upsert di atas.
      const res = await fetch("/api/pengajuan-surat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenisSuratId,
          wargaId: warga.id,
          dataForm: dataFormLengkap,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error);

      router.push("/pengajuan-surat");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan pengajuan");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldDinamisLainnya =
    jenisTerpilih?.skemaField.filter((f) => !FIELD_SUDAH_ADA_KOTAK_SENDIRI.has(f.key)) ?? [];

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500";
  const labelClass = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-semibold text-slate-900">Buat Pengajuan Surat</h2>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        {/* Pilih jenis surat */}
        <div>
          <label className={labelClass}>Jenis Surat</label>
          <select
            required
            value={jenisSuratId}
            onChange={(e) => setJenisSuratId(e.target.value)}
            className={inputClass}
          >
            <option value="">Pilih jenis surat...</option>
            {daftarJenisSurat.map((j) => (
              <option key={j.id} value={j.id}>{j.nama}</option>
            ))}
          </select>
        </div>

        {/* Pencarian opsional */}
        <div>
          <label className={labelClass}>Cari Warga Terdaftar</label>
          <input
            value={queryPencarian}
            onChange={(e) => setQueryPencarian(e.target.value)}
            placeholder="Ketik nama atau NIK, minimal 3 karakter..."
            className={inputClass}
          />
          {hasilPencarian.length > 0 && (
            <div className="mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              {hasilPencarian.map((w) => (
                <button
                  type="button"
                  key={w.id}
                  onClick={() => pilihDariPencarian(w)}
                  className="block w-full px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50"
                >
                  {w.nama} — {w.nik}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Data Pemohon: selalu tampil, sumber kebenaran tunggal untuk 6 field ini */}
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Data Pemohon</h3>
            {wargaTerhubung && (
              <span className="text-xs text-green-600">✓ Data warga tersimpan — bisa diedit di bawah</span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Nama Lengkap <span className="text-red-500">*</span></label>
              <input
                required
                value={pemohon.nama}
                onChange={(e) => updatePemohon("nama", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>NIK <span className="text-red-500">*</span></label>
              <input
                required
                value={pemohon.nik}
                onChange={(e) => updatePemohon("nik", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tempat Lahir</label>
              <input
                value={pemohon.tempatLahir}
                onChange={(e) => updatePemohon("tempatLahir", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tanggal Lahir</label>
              <input
                type="date"
                value={pemohon.tanggalLahir}
                onChange={(e) => updatePemohon("tanggalLahir", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Jenis Kelamin</label>
              <select
                value={pemohon.jenisKelamin}
                onChange={(e) => updatePemohon("jenisKelamin", e.target.value)}
                className={inputClass}
              >
                <option value="">Pilih...</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Pekerjaan</label>
              <input
                value={pemohon.pekerjaan}
                onChange={(e) => updatePemohon("pekerjaan", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Alamat</label>
              <input
                value={pemohon.alamat}
                onChange={(e) => updatePemohon("alamat", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Data di atas otomatis tersimpan/terupdate ke Data Warga saat surat diajukan
            (dicocokkan berdasarkan NIK).
          </p>
        </div>

        {/* Field dinamis sesuai jenis surat (6 field pemohon sudah diwakili di atas) */}
        {fieldDinamisLainnya.map((field) => (
          <div key={field.key}>
            <label className={labelClass}>
              {field.label}{field.required && <span className="text-red-500"> *</span>}
            </label>
            {field.type === "table" ? (
              <FieldTabelDinamis
                field={field}
                value={(dataForm[field.key] as Record<string, string>[]) || []}
                onChange={(rows) => setDataForm((d) => ({ ...d, [field.key]: rows }))}
              />
            ) : field.type === "textarea" ? (
              <textarea
                required={field.required}
                placeholder={field.placeholder}
                value={String(dataForm[field.key] ?? "")}
                onChange={(e) => setDataForm((d) => ({ ...d, [field.key]: e.target.value }))}
                className={inputClass}
                rows={3}
              />
            ) : field.type === "select" ? (
              <select
                required={field.required}
                value={String(dataForm[field.key] ?? "")}
                onChange={(e) => setDataForm((d) => ({ ...d, [field.key]: e.target.value }))}
                className={inputClass}
              >
                <option value="">Pilih...</option>
                {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                value={String(dataForm[field.key] ?? "")}
                onChange={(e) => setDataForm((d) => ({ ...d, [field.key]: e.target.value }))}
                className={inputClass}
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting || !jenisSuratId}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "Menyimpan..." : "Ajukan Surat"}
        </button>
      </form>
    </div>
  );
}
