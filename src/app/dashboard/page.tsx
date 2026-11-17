import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ROLE_DASHBOARD_PATHS } from "@/lib/constants";
import { Role } from "@/lib/constants";

/**
 * /dashboard → redirect ke dashboard spesifik berdasarkan role user
 */
export default async function DashboardIndexPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role         = session.user.role as Role;
  const dashboardPath = ROLE_DASHBOARD_PATHS[role] ?? "/login";

  redirect(dashboardPath);
}

