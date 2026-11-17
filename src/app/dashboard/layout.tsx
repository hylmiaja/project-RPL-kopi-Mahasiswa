import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Role } from "@/lib/constants";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <DashboardSidebar
        user={{
          name:  session.user.name  ?? "Pengguna",
          email: session.user.email ?? "",
          role:  session.user.role  as Role,
          image: session.user.image ?? null,
        }}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

