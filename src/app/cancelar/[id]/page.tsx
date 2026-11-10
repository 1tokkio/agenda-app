import "@/styles/untitled-theme.css";
import { formatDayLabel } from "@/agenda/logic";
import { getMeetingSummary } from "@/lib/bookings";
import { isValidCancelToken } from "@/lib/cancel-link";
import { config } from "@/lib/config";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cancelar reunión", robots: { index: false } };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/** Página del enlace "Cancelar reunión" del correo. No pide sesión: el código del enlace es el permiso. */
export default async function CancelMeetingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { t } = await searchParams;
  const token = typeof t === "string" ? t : undefined;
  const meeting = isValidCancelToken(id, token) ? await getMeetingSummary(await defaultContext(), id) : null;

  return (
    <div className="untitled finland">
      <main className="flex min-h-screen items-center justify-center bg-surface-2 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <p className="text-sm font-semibold text-brand-text">
            {config.name} · {config.subtitle}
          </p>
          {!meeting ? (
            <Message title="Este enlace no es válido" text="Revisa que hayas abierto el enlace completo del correo de confirmación." />
          ) : meeting.status === "cancelled" ? (
            <Message title="La reunión fue cancelada" text="El horario quedó libre en la agenda. No tienes que hacer nada más." />
          ) : (
            <>
              <h1 className="mt-2 text-2xl font-medium text-text" style={{ fontFamily: "var(--font-display)" }}>
                {meeting.upcoming ? "¿Cancelar esta reunión?" : "Esta reunión ya comenzó"}
              </h1>
              <div className="mt-5 flex flex-col gap-0.5 rounded-xl bg-brand-soft px-4 py-3">
                <span className="text-[15px] font-semibold text-brand-text first-letter:uppercase">{formatDayLabel(meeting.date)}</span>
                <span className="text-sm text-brand-text tabular-nums">
                  {meeting.time} – {meeting.endTime} · {meeting.roomName}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted">Asunto</dt>
                <dd className="font-medium text-text">{meeting.title}</dd>
                <dt className="text-muted">Con</dt>
                <dd className="font-medium text-text">{meeting.targetName}</dd>
              </dl>
              {meeting.upcoming ? (
                <form method="post" action={`/api/agenda/bookings/${meeting.id}/cancel`} className="mt-6 flex flex-col gap-3">
                  <input type="hidden" name="t" value={token} />
                  <p className="text-sm text-muted">Al cancelar, el horario queda libre para que otra persona lo reserve. Esta acción no se puede deshacer.</p>
                  <button type="submit" className="h-11 rounded-[10px] border border-danger-bd px-4 text-sm font-semibold text-danger hover:bg-danger-soft">
                    Sí, cancelar reunión
                  </button>
                </form>
              ) : (
                <p className="mt-6 text-sm text-muted">Ya no se puede cancelar desde este enlace.</p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <>
      <h1 className="mt-2 text-2xl font-medium text-text" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h1>
      <p className="mt-3 text-sm text-muted">{text}</p>
    </>
  );
}
