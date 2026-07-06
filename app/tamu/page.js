import { requireAccess } from "@/lib/guard";
import TamuClient from "./TamuClient";
export default async function Page() {
  const s = await requireAccess("tamu");
  return <TamuClient user={s}/>;
}
