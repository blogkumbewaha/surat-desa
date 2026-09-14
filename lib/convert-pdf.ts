import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";

const execFileAsync = promisify(execFile);

// Lokasi umum binary LibreOffice/soffice di berbagai OS.
// Bisa juga di-override lewat env var LIBREOFFICE_PATH kalau lokasinya beda.
const KANDIDAT_PATH_SOFFICE = [
  process.env.LIBREOFFICE_PATH,
  "soffice", // kalau sudah ada di PATH (Linux/umum)
  "/Applications/LibreOffice.app/Contents/MacOS/soffice", // macOS default
  "/usr/bin/soffice", // Linux default
  "/opt/homebrew/bin/soffice", // macOS Apple Silicon via brew (symlink kadang di sini)
].filter(Boolean) as string[];

let cachedSofficePath: string | null = null;

async function cariSofficePath(): Promise<string | null> {
  if (cachedSofficePath) return cachedSofficePath;

  for (const candidate of KANDIDAT_PATH_SOFFICE) {
    try {
      await execFileAsync(candidate, ["--version"]);
      cachedSofficePath = candidate;
      return candidate;
    } catch {
      // coba kandidat berikutnya
    }
  }
  // Sengaja TIDAK cache hasil "tidak ketemu" — supaya kalau LibreOffice baru
  // saja selesai diinstall, percobaan berikutnya langsung ketemu tanpa perlu
  // restart server.
  return null;
}

export class LibreOfficeTidakDitemukanError extends Error {
  constructor() {
    super(
      "LibreOffice tidak ditemukan di server ini. Install LibreOffice untuk mengaktifkan " +
        "unduh PDF (di macOS: `brew install --cask libreoffice`), atau set env var " +
        "LIBREOFFICE_PATH ke lokasi binary soffice-nya. Sementara ini, gunakan tombol " +
        '"Unduh Word (.docx)".'
    );
  }
}

/** Convert buffer dokumen (docx/xlsx/dll) menjadi buffer .pdf memakai LibreOffice headless. */
export async function convertKePdf(sourceBuffer: Buffer, ekstensiAsli: string): Promise<Buffer> {
  const sofficePath = await cariSofficePath();
  if (!sofficePath) {
    throw new LibreOfficeTidakDitemukanError();
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "surat-desa-"));
  const sourcePath = path.join(tmpDir, `input${ekstensiAsli}`);
  const pdfPath = path.join(tmpDir, "input.pdf");

  try {
    fs.writeFileSync(sourcePath, sourceBuffer);
    await execFileAsync(sofficePath, [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      tmpDir,
      sourcePath,
    ]);

    if (!fs.existsSync(pdfPath)) {
      throw new Error("Konversi PDF gagal: file hasil tidak ditemukan");
    }
    return fs.readFileSync(pdfPath);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
