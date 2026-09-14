import { redirect } from "next/navigation";

export default function Home() {
  // Middleware sudah menangani redirect ke /login kalau belum ada session,
  // jadi kalau sampai di sini berarti sudah login -> lempar ke dashboard.
  redirect("/dashboard");
}
