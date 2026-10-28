import "@/styles/untitled-theme.css";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/admin/AppShell";
import { AgendaProvider } from "@/agenda/store";
import { hasAdminSession } from "@/lib/admin-auth";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

// Estilo "untitled" con la ambientación finlandesa. El perfil muestra ADMIN_NAME y ADMIN_EMAIL.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const user = {
    name: process.env.ADMIN_NAME || "Organización",
    email: process.env.ADMIN_EMAIL || "",
  };
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
