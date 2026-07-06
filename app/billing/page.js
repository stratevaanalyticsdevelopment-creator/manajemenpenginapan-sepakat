import { requireAccess } from "@/lib/guard";
import BillingClient from "./BillingClient";
export default async function Page() {
  const s = await requireAccess("billing");
  return <BillingClient user={s}/>;
}
