"use client";

import { useEffect, useState } from "react";
import { keLabelJenisKelamin } from "@/lib/jenis-kelamin";

interface Warga {
  id: string;
  nik: string;
  nama: string;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  jenisKelamin: string | null;
  pekerjaan: string | null;
  alamat: string | null;
  agama: string | null;
  statusPerkawinan: string | null;
  noKK: string | null;
  noHp: string | null;
  rt: string | null;
  rw: string | null;
}

const FORM_KOSONG = {
  nik: "", nama: "", tempatLahir: "", tanggalLahir: "", jenisKelamin: "",
  pekerjaan: "", alamat: "", agama: "", statusPerkawinan: "", noKK: "", noHp: "",
  rt: "", rw: "",
};

export default function WargaPage() {
  const [daftar, setDaftar] = useState<Warga[]>([]);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingNik, setEditingNik] = useState<string | null>(null); // null = mode tambah baru
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(FORM_KOSONG);

  async function muatData(q: string) {
    const res = await fetch(`/api/warga?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    setDaftar(json.data || []);
  }

  useEffect(() => {
    muatData("");
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => muatData(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  function bukaFormTambah() {
    setForm(FORM_KOSONG);
    setEditingNik(null);
    setShowForm(true);
  }

  function bukaFormEdit(w: Warga) {
    setForm({
      nik: w.nik,
      nama: w.nama,
      tempatLahir: w.tempatLahir || "",
      tanggalLahir: w.tanggalLahir ? w.tanggalLahir.slice(0, 10) : "",
      jenisKelamin: keLabelJenisKelamin(w.jenisKelamin) || "",
      pekerjaan: w.pekerjaan || "",
      alamat: w.alamat || "",
      agama: w.agama || "",
      statusPerkawinan: w.statusPerkawinan || "",
      noKK: w.noKK || "",
      noHp: w.noHp || "",
      rt: w.rt || "",
      rw: w.rw || "",
    });
    setEditingNik(w.nik);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/warga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setShowForm(false);
      setForm(FORM_KOSONG);
      setEditingNik(null);
      muatData(query);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan data warga");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Data Warga</h2>
        <button
          onClick={() => (showForm ? setShowForm(false) : bukaFormTambah())}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Batal" : "+ Tambah Warga"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
        >
          <h3 className="text-sm font-semibold text-slate-700 sm:col-span-2">
            {editingNik ? `Edit Data Warga — ${editingNik}` : "Tambah Warga Baru"}
          </h3>

          <input
            required
            readOnly={!!editingNik}
            placeholder="NIK"
            value={form.nik}
            onChange={(e) => setForm({ ...form, nik: e.target.value })}
            className={`${inputClass} ${editingNik ? "bg-slate-100" : ""}`}
          />
          <input
            required
            placeholder="Nama Lengkap"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Tempat Lahir"
            value={form.tempatLahir}
            onChange={(e) => setForm({ ...form, tempatLahir: e.target.value })}
            className={inputClass}
          />
          <input
            type="date"
            placeholder="Tanggal Lahir"
            value={form.tanggalLahir}
            onChange={(e) => setForm({ ...form, tanggalLahir: e.target.value })}
            className={inputClass}
          />
          <select
            value={form.jenisKelamin}
            onChange={(e) => setForm({ ...form, jenisKelamin: e.target.value })}
            className={inputClass}
          >
            <option value="">Jenis Kelamin...</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
          <input
            placeholder="Agama"
            value={form.agama}
            onChange={(e) => setForm({ ...form, agama: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Status Perkawinan"
            value={form.statusPerkawinan}
            onChange={(e) => setForm({ ...form, statusPerkawinan: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Pekerjaan"
            value={form.pekerjaan}
            onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Alamat"
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
            className={`${inputClass} sm:col-span-2`}
          />
          <input
            placeholder="RT"
            value={form.rt}
            onChange={(e) => setForm({ ...form, rt: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="RW"
            value={form.rw}
            onChange={(e) => setForm({ ...form, rw: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="No. KK"
            value={form.noKK}
            onChange={(e) => setForm({ ...form, noKK: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="No. HP"
            value={form.noHp}
            onChange={(e) => setForm({ ...form, noHp: e.target.value })}
            className={inputClass}
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 sm:col-span-2"
          >
            {loading ? "Menyimpan..." : editingNik ? "Simpan Perubahan" : "Simpan Warga"}
          </button>
        </form>
      )}

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari nama atau NIK..."
        className="mb-4 w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Nama</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">NIK</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Tempat/Tgl Lahir</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">J. Kelamin</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Pekerjaan</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Alamat</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((w) => (
              <tr key={w.id} className="border-b border-slate-100 last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-slate-900">{w.nama}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{w.nik}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {w.tempatLahir || "-"}
                  {w.tanggalLahir ? `, ${new Date(w.tanggalLahir).toLocaleDateString("id-ID")}` : ""}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {keLabelJenisKelamin(w.jenisKelamin) || "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{w.pekerjaan || "-"}</td>
                <td className="px-4 py-3 text-slate-600">{w.alamat || "-"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    onClick={() => bukaFormEdit(w)}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {daftar.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Belum ada data warga.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
