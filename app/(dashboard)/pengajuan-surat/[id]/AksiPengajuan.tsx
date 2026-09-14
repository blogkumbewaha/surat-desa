"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AksiPengajuan({
  id,
  status,
  role,
  templateDokumen,
}: {
  id: string;
  status: string;
  role: string;
  templateDokumen: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<"asli" | "pdf" | null>(null);

  const bisaApprove = ["SEKRETARIS", "KEPALA_DESA", "ADMIN"].includes(role);
  const bisaHapus = role === "ADMIN";
  const isXlsx = templateDokumen?.toLowerCase().endsWith(".xlsx");
  const labelAsli = isXlsx ? "Unduh Excel (.xlsx)" : "Unduh Word (.docx)";

  async function setujui() {
    setLoading(true);
    try {
      const res = await fetch(`/api/pengajuan-surat/${id}/setujui`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyetujui pengajuan");
    } finally {
      setLoading(false);
    }
  }

  async function tolak() {
    const catatan = prompt("Alasan penolakan:");
    if (!catatan) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pengajuan-surat/${id}/tolak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catatan }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menolak pengajuan");
    } finally {
      setLoading(false);
    }
  }

  async function unduh(format: "asli" | "pdf") {
    setDownloading(format);
    try {
      const res = await fetch(`/api/pengajuan-surat/${id}/cetak?format=${format}`);
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Gagal membuat dokumen");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] || `surat.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      router.refresh(); // status bisa berubah jadi DICETAK
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengunduh dokumen");
    } finally {
      setDownloading(null);
    }
  }

  async function hapus() {
    if (!confirm("Hapus pengajuan surat ini? Tindakan ini tidak bisa dibatalkan.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/pengajuan-surat/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push("/pengajuan-surat");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus pengajuan");
      setLoading(false);
    }
  }

  const tombolHapus = bisaHapus ? (
    <button
      onClick={hapus}
      disabled={loading}
      className="text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      Hapus Pengajuan
    </button>
  ) : null;

  if (status === "DIAJUKAN" || status === "DIPROSES") {
    if (!bisaApprove) {
      return (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Menunggu persetujuan Sekretaris/Kepala Desa.
          </p>
          {tombolHapus}
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={setujui}
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Setujui"}
          </button>
          <button
            onClick={tolak}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Tolak
          </button>
        </div>
        {tombolHapus}
      </div>
    );
  }

  if (status === "DISETUJUI" || status === "DICETAK") {
    return (
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={() => unduh("asli")}
            disabled={downloading !== null}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {downloading === "asli" ? "Menyiapkan..." : labelAsli}
          </button>
          
        </div>
        {tombolHapus}
      </div>
    );
  }

  return <div className="flex justify-end">{tombolHapus}</div>; // DITOLAK
}
