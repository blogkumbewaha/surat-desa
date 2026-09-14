import type { SessionPayload } from "./session";

/** Cek apakah session yang sedang login termasuk salah satu peran yang diizinkan. */
export function cekPeran(session: SessionPayload | null, peranDiizinkan: string[]): boolean {
  if (!session) return false;
  return peranDiizinkan.includes(session.role);
}

export const PERAN_APPROVAL = ["SEKRETARIS", "KEPALA_DESA", "ADMIN"];
export const PERAN_ADMIN = ["ADMIN"];
