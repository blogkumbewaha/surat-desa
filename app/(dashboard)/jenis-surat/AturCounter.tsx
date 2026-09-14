"use client";

import { useEffect, useState } from "react";

export default function AturCounter({ jenisSuratId }: { jenisSuratId: string }) {
  const tahunIni = new Date().getFullYear();
  const [nilai, setNilai] = useState<string>("");
  const [tersimpan, setTersimpan] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [buka, setBuka] = useState(false);

  useEffect(() => {
    if (!buka) return;
    fetch(`/api/jenis-surat/${jenisSuratId}/counter?tahun=${tahunIni}`)
      .then((res) => res.json())
      .then((res) => {
        setTersimpan(res.data.counterTerakhir);
        setNilai(String(res.data.counterTerakhir));
      });
  }, [buka, jenisSuratId, tahunIni]);

  async function simpan() {
    setSaving(true);
    try {
      const res = await fetch(`/api/jenis-surat/${jenisSuratId}/counter`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tahun: tahunIni, counterTerakhir: Number(nilai) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setTersimpan(Number(nilai));
      setBuka(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan nomor urut");
    } finally {
      setSaving(false);
    }
  }

  if (!buka) {
    return (
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="mt-2 text-xs font-medium text-slate-500 underline hover:text-slate-800"
      >
        {tersimpan !== null
          ? `Nomor urut terakhir (${tahunIni}): ${tersimpan}`
          : `Atur nomor urut terakhir (${tahunIni})`}
      </button>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        type="number"
        min={0}
        value={nilai}
        onChange={(e) => setNilai(e.target.value)}
        className="w-20 rounded border border-slate-300 px-2 py-1 text-xs text-slate-900 outline-none focus:border-slate-500"
      />
      <button
        type="button"
        onClick={simpan}
        disabled={saving}
        className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? "..." : "Simpan"}
      </button>
      <button
        type="button"
        onClick={() => setBuka(false)}
        className="text-xs text-slate-400 hover:text-slate-600"
      >
        Batal
      </button>
    </div>
  );
}
