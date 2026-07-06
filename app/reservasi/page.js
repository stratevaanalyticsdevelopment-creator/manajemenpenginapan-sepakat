import { requireAccess } from "@/lib/guard";
import ReservasiClient from "./ReservasiClient";
export default async function Page() {
  const s = await requireAccess("reservasi");
  return <ReservasiClient user={s}/>;
}
