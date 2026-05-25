import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { roleHome } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function DashboardIndex() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(roleHome(session.user.role));
}
