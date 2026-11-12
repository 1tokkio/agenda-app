import "@/styles/untitled-theme.css";
import { AgendaProvider } from "@/agenda/store";
import { Landing } from "@/agenda/Landing";
import { PublicShell } from "@/agenda/PublicShell";
import { PublicView } from "@/agenda/PublicView";
import { currentUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Sin sesión se ve la página de inicio, con el botón para ingresar. Con sesión, la agenda de la reunión: solo usuarios
// creados por el administrador. Los datos llegan desde /api/agenda.
export default async function Home() {
  const user = await currentUser();
  if (!user) return <Landing />;
  return (
    <div className="untitled finland min-h-screen">
      <AgendaProvider mode="public">
        <PublicShell user={{ name: user.name, email: user.email ?? "" }} isAdmin={user.role === "admin"}>
          <PublicView />
        </PublicShell>
      </AgendaProvider>
    </div>
  );
}
