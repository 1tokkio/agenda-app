import "@/styles/untitled-theme.css";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/admin/AppShell";
import { AgendaProvider } from "@/agenda/store";
import { currentAdmin } from "@/lib/admin-auth";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

// Estilo "untitled" con la ambientación finlandesa. El perfil muestra al usuario que inició sesión.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
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
