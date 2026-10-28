import "@/styles/untitled-theme.css";
import { AgendaProvider } from "@/agenda/store";
import { PublicShell } from "@/agenda/PublicShell";
import { PublicView } from "@/agenda/PublicView";

// Agenda pública: tótem y dispositivos de cualquier visitante. Los datos llegan desde /api/agenda.
export default function Home() {
  return (
    <div className="untitled finland min-h-screen">
      <AgendaProvider mode="public">
        <PublicShell>
          <PublicView />
        </PublicShell>
      </AgendaProvider>
    </div>
  );
}
