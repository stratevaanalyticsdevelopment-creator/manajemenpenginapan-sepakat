import { requireAccess } from "@/lib/guard";
import PengaturanClient from "./PengaturanClient";
export default async function Page() {
  const s = await requireAccess("pengaturan");
  return <PengaturanClient user={s}/>;
}
