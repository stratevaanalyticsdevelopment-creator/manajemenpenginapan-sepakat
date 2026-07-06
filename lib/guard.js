import { redirect } from "next/navigation";
import { getSession, canAccess } from "@/lib/auth";

// Dipanggil di setiap page.js (server component) untuk memastikan
// pengguna sudah login dan punya akses ke halaman terkait.
export async function requireAccess(menuKey) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (menuKey && !canAccess(session.role, menuKey)) {
    redirect("/dashboard");
  }
  return session;
}
