/** "Laki-laki"/"L" -> "L", "Perempuan"/"P" -> "P". Selain itu, dikembalikan apa adanya. */
export function keKodeJenisKelamin(val: unknown): string | undefined {
  if (typeof val !== "string" || !val.trim()) return undefined;
  if (val === "Laki-laki" || val === "L") return "L";
  if (val === "Perempuan" || val === "P") return "P";
  return val;
}

/** "L" -> "Laki-laki", "P" -> "Perempuan". Selain itu, dikembalikan apa adanya. */
export function keLabelJenisKelamin(val: string | null | undefined): string | undefined {
  if (!val) return undefined;
  if (val === "L") return "Laki-laki";
  if (val === "P") return "Perempuan";
  return val;
}
