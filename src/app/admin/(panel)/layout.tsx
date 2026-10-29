import "@/styles/untitled-theme.css";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/admin/AppShell";
import { AgendaProvider } from "@/agenda/store";
import { currentUser } from "@/lib/admin-auth";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

// Panel solo para administradores. Los usuarios comunes vuelven a la agenda.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentUser();
  if (!admin) redirect("/login");
  if (admin.role !== "admin") redirect("/");
  const user = { name: admin.name, email: admin.email };
  return (
    <div className="untitled finland">
      <AgendaProvider mode="admin">
        <AppShell eventName={config.name} brandSubtitle={config.subtitle} logoText={config.logoText} user={user}>
          {children}
        </AppShell>
      </AgendaProvider>
    </div>
  );
}
