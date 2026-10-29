import "@/styles/untitled-theme.css";
import { redirect } from "next/navigation";
import { AgendaProvider } from "@/agenda/store";
import { PublicShell } from "@/agenda/PublicShell";
import { PublicView } from "@/agenda/PublicView";
import { currentUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Agenda de la reunión: solo usuarios creados por el administrador. Los datos llegan desde /api/agenda.
export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <div className="untitled finland min-h-screen">
      <AgendaProvider mode="public">
        <PublicShell user={{ name: user.name, email: user.email }} isAdmin={user.role === "admin"}>
          <PublicView me={{ companyId: user.companyId, companyName: user.companyName }} />
        </PublicShell>
      </AgendaProvider>
    </div>
  );
}
