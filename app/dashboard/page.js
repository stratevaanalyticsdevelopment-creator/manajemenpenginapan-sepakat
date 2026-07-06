import { requireAccess } from "@/lib/guard";
import DashboardClient from "./DashboardClient";
export default async function Page() {
  const s = await requireAccess("dashboard");
  return <DashboardClient user={s}/>;
}
