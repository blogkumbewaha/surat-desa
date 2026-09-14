"use client";

import type { FieldSurat } from "@/lib/types";

type Baris = Record<string, string>;

export default function FieldTabelDinamis({
  field,
  value,
  onChange,
}: {
  field: FieldSurat;
  value: Baris[];
  onChange: (rows: Baris[]) => void;
}) {
  const kolom = field.columns || [];
  const maxRows = field.maxRows;
  const inputClass =
    "w-full rounded border border-slate-300 px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-500";

  function tambahBaris() {
    if (maxRows && value.length >= maxRows) return;
    onChange([...value, {}]);
  }
  function hapusBaris(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }
  function updateSel(index: number, key: string, val: string) {
    const next = value.map((b, i) => (i === index ? { ...b, [key]: val } : b));
    onChange(next);
  }

  return (
    <div>
      <div className="space-y-3">
        {value.map((baris, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {field.label} #{i + 1}
              </span>
              <button
                type="button"
                onClick={() => hapusBaris(i)}
                className="text-xs font-medium text-red-500 hover:text-red-700"
              >
                Hapus
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {kolom.map((kol) => (
                <div key={kol.key}>
                  <label className="mb-0.5 block text-xs text-slate-500">
                    {kol.label}
                    {kol.required && <span className="text-red-500"> *</span>}
                  </label>
                  {kol.type === "select" ? (
                    <select
                      required={kol.required}
                      value={baris[kol.key] || ""}
                      onChange={(e) => updateSel(i, kol.key, e.target.value)}
                      className={inputClass}
                    >
                      <option value="">-</option>
                      {kol.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      required={kol.required}
                      type={kol.type === "date" ? "date" : "text"}
                      value={baris[kol.key] || ""}
                      onChange={(e) => updateSel(i, kol.key, e.target.value)}
                      className={inputClass}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {value.length === 0 && (
        <p className="mb-2 text-xs text-slate-400">
          Belum ada data. Klik tombol di bawah untuk menambah {field.label.toLowerCase()}.
        </p>
      )}

      {(!maxRows || value.length < maxRows) && (
        <button
          type="button"
          onClick={tambahBaris}
          className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700"
        >
          + Tambah {field.label}
        </button>
      )}
      {maxRows && value.length >= maxRows && (
        <p className="mt-2 text-xs text-amber-600">Maksimal {maxRows} baris untuk field ini.</p>
      )}
    </div>
  );
}
