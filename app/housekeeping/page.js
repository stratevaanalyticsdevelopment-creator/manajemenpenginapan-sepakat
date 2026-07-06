import { requireAccess } from "@/lib/guard";
import HousekeepingClient from "./HousekeepingClient";
export default async function Page() {
  const s = await requireAccess("housekeeping");
  return <HousekeepingClient user={s}/>;
}
