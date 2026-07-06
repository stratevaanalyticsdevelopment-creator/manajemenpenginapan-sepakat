import { requireAccess } from "@/lib/guard";
import KamarClient from "./KamarClient";
export default async function Page() {
  const s = await requireAccess("kamar");
  return <KamarClient user={s}/>;
}
