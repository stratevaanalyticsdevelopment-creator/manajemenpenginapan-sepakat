import { requireAccess } from "@/lib/guard";
import PembayaranClient from "./PembayaranClient";
export default async function Page() {
  const s = await requireAccess("pembayaran");
  return <PembayaranClient user={s}/>;
}
