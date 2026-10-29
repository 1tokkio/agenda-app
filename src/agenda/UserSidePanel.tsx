"use client";

import { DAYS, SLOT_TIMES, type Meeting } from "./data";
import { endTime, formatDayLabel, formatDayShort } from "./logic";
import { useAgenda } from "./store";
import { isOwnMeeting, type MyCompany } from "./UserAgenda";

/** Panel de la agenda del usuario: próxima reunión, sus reuniones y la ocupación de cada día. */
export function UserSidePanel({ me, now }: { me: MyCompany | null; now: { date: string; minutes: number } | null }) {
  const { meetings, blocks } = useAgenda();

  const mine = meetings.filter((m) => isOwnMeeting(m, me)).sort(byStart);
  const next = mine.find((m) => isUpcoming(m, now)) ?? null;

  return (
    <aside aria-label="Resumen de mi agenda" className="flex flex-col gap-4">
      <section className="flex flex-col gap-3.5 rounded-2xl border border-border bg-surface p-5">
        <span className="text-xs font-semibold tracking-[0.08em] text-muted">PRÓXIMA REUNIÓN</span>
        {next ? (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-[21px] leading-snug font-normal text-text" style={{ fontFamily: "var(--font-display)" }}>
                {next.title}
              </span>
              <span className="flex items-center gap-2 text-sm text-text-2 tabular-nums">
                <ClockIcon />
                {formatDayLabel(next.date)} · {next.time} – {endTime(next.time)}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-[10px] bg-brand-soft px-3 py-2.5 text-[13px] font-medium text-brand-text">
              <PinIcon />
              Sala de reuniones · Expocorma 2026
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">No tienes reuniones próximas. Elige un bloque libre en la agenda.</p>
        )}
      </section>

      <section className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-lg font-medium text-text" style={{ fontFamily: "var(--font-display)" }}>
            Mis reuniones
          </span>
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-text tabular-nums">{mine.length}</span>
        </div>
        {mine.length === 0 ? (
          <p className="py-2 text-sm text-muted">Todavía no tienes reuniones agendadas.</p>
        ) : (
          mine.map((m) => (
            <div key={m.id} className="flex items-center gap-3.5 border-t border-border-soft py-3">
              <span className="w-[84px] shrink-0 text-xs font-medium text-muted">{formatDayShort(m.date)}</span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-sm font-medium text-text">{m.title}</span>
                <span className="text-[13px] text-muted tabular-nums">
                  {m.time} – {endTime(m.time)}
                </span>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
        <span className="text-lg font-medium text-text" style={{ fontFamily: "var(--font-display)" }}>
          Ocupación de la sala
        </span>
        {DAYS.map((date) => {
          const booked = meetings.filter((m) => m.date === date).length;
          const blocked = blocks.filter((b) => b.date === date).length;
          const bookable = SLOT_TIMES.length - blocked;
          const pct = bookable > 0 ? Math.round((booked / bookable) * 100) : 0;
          return (
            <div key={date} className="flex flex-col gap-2">
              <div className="flex justify-between text-[13px]">
                <span className="font-medium text-text-2">{formatDayShort(date)}</span>
                <span className="text-muted tabular-nums">
                  {pct}% · {SLOT_TIMES.length - booked - blocked} libres
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full border border-border-soft bg-surface-2">
                <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </section>
    </aside>
  );
}

function byStart(a: Meeting, b: Meeting) {
  return a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date);
}

/** Reunión que todavía no empieza. Sin reloj (servidor), se toma la primera. */
function isUpcoming(m: Meeting, now: { date: string; minutes: number } | null): boolean {
  if (!now) return true;
  if (m.date !== now.date) return m.date > now.date;
  const [h, min] = m.time.split(":").map(Number);
  return h * 60 + min >= now.minutes;
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="shrink-0 text-muted">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
