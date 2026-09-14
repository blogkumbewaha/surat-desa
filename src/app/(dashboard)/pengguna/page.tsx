"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  nama: string;
  username: string;
  role: string;
  aktif: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  OPERATOR: "Operator",
  SEKRETARIS: "Sekretaris",
  KEPALA_DESA: "Kepala Desa",
  ADMIN: "Admin",
};

const FORM_KOSONG = { nama: "", username: "", password: "", role: "OPERATOR" };

export default function PenggunaPage() {
  const [daftar, setDaftar] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_KOSONG);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tidakBerhakAkses, setTidakBerhakAkses] = useState(false);

  async function muatData() {
    const res = await fetch("/api/users");
    if (res.status === 403) {
      setTidakBerhakAkses(true);
      return;
    }
    const json = await res.json();
    setDaftar(json.data || []);
  }

  useEffect(() => {
    muatData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setForm(FORM_KOSONG);
      setShowForm(false);
      muatData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah pengguna");
    } finally {
      setLoading(false);
    }
  }

  async function toggleAktif(user: User) {
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktif: !user.aktif }),
    });
    muatData();
  }

  async function ubahRole(user: User, role: string) {
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    muatData();
  }

  if (tidakBerhakAkses) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Halaman ini khusus untuk akun dengan peran Admin.
      </div>
    );
  }

  const inputClass = "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Kelola Pengguna</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Batal" : "+ Tambah Pengguna"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
        >
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
              {error}
            </div>
          )}
          <input
            required
            placeholder="Nama Lengkap"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            className={inputClass}
          />
          <input
            required
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className={inputClass}
          />
          <input
            required
            type="password"
            placeholder="Password (minimal 6 karakter)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={inputClass}
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className={inputClass}
          >
            {Object.entries(ROLE_LABEL).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 sm:col-span-2"
          >
            {loading ? "Menyimpan..." : "Simpan Pengguna"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Peran</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-900">{u.nama}</td>
                <td className="px-4 py-3 text-slate-600">{u.username}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => ubahRole(u, e.target.value)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-900"
                  >
                    {Object.entries(ROLE_LABEL).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAktif(u)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      u.aktif ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {u.aktif ? "Aktif" : "Nonaktif"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
