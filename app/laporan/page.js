import { requireAccess } from "@/lib/guard";
import LaporanClient from "./LaporanClient";
export default async function Page() {
  const s = await requireAccess("laporan");
  return <LaporanClient user={s}/>;
}
