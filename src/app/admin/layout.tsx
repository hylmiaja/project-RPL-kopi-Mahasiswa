import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";

export const metadata = {
  title: "Admin Panel – Kopi Mahasiswa",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Hanya perbolehkan ADMIN dan OWNER
  if (session.user?.role !== "ADMIN" && session.user?.role !== "OWNER") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex bg-slate-950 dark:bg-[#120D0A] text-white relative z-20">
      {/* Sidebar Solid di sebelah kiri */}
      <Sidebar
        user={{
          name: session.user?.name,
          email: session.user?.email,
          role: session.user?.role,
        }}
      />
      {/* Main Content Area Solid Non-Transparan Terisolasi Rapi */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-slate-900 dark:bg-[#1E120B] p-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

