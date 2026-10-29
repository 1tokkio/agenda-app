"use client";

import { useState } from "react";
import { COMPANIES, type Meeting } from "./data";
import { endTime, formatDayLabel } from "./logic";
import type { BookingInput, FieldErrors } from "@/lib/booking-rules";
import { type Result } from "./types";

type Props = {
  date: string;
  time: string;
  initial?: Meeting;
  submitLabel: string;
  onSubmit: (input: BookingInput) => Promise<Result<Meeting>>;
  onDone: (meeting: Meeting) => void;
  onCancelMeeting?: () => void;
  onClose: () => void;
};

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-surface px-3.5 text-base text-text placeholder:text-muted focus:outline-2 focus:outline-offset-[-1px] focus:outline-brand md:text-sm";

/** Formulario de agendamiento. Lo usan la agenda del usuario y el panel de admin. */
export function MeetingForm({ date, time, initial, submitLabel, onSubmit, onDone, onCancelMeeting, onClose }: Props) {
  const [values, setValues] = useState({
    title: initial?.title ?? "",
    requesterName: initial?.requesterName ?? "",
    requesterCompany: initial?.requesterCompany ?? "",
    targetCompanyId: initial?.targetCompanyId ?? "",
    requesterEmail: initial?.requesterEmail ?? "",
    guestEmail: initial?.guestEmail ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await onSubmit({ ...values, date, time });
      if (result.ok) {
        onDone(result.value);
      } else {
        setErrors(result.errors);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-x-4 gap-y-3.5 md:grid-cols-2" noValidate>
      {/* Día y hora confirmados */}
      <div className="flex flex-col gap-0.5 rounded-[12px] bg-brand-soft px-4 py-3 md:col-span-2">
        <span className="text-[15px] font-semibold text-brand-text">{formatDayLabel(date)}</span>
        <span className="text-sm text-brand-text tabular-nums">
          {time} – {endTime(time)} · 30 min · Sala de reuniones
        </span>
      </div>
      {errors.time && <p role="alert" className="text-sm text-danger md:col-span-2">{errors.time}</p>}
      {errors.date && <p role="alert" className="text-sm text-danger md:col-span-2">{errors.date}</p>}

      <Field label="Tu nombre" error={errors.requesterName}>
        <input className={inputClass} value={values.requesterName} onChange={(e) => set("requesterName", e.target.value)} autoComplete="name" />
      </Field>

      <Field label="Tu empresa" error={errors.requesterCompany}>
        <input className={inputClass} value={values.requesterCompany} onChange={(e) => set("requesterCompany", e.target.value)} autoComplete="organization" />
      </Field>

      <Field label="Asunto de la reunión" error={errors.title} wide>
        <input className={inputClass} value={values.title} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder="Ej.: Presentación de catálogo" />
      </Field>

      <Field label="Empresa con la que te reúnes" error={errors.targetCompanyId}>
        <select className={inputClass} value={values.targetCompanyId} onChange={(e) => set("targetCompanyId", e.target.value)}>
          <option value="">Elige una empresa</option>
          {COMPANIES.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Tu correo (recibirás la confirmación)" error={errors.requesterEmail}>
        <input type="email" inputMode="email" className={inputClass} value={values.requesterEmail} onChange={(e) => set("requesterEmail", e.target.value)} autoComplete="email" />
      </Field>

      <Field label="Correo de la otra persona (opcional)" error={errors.guestEmail} hint="Si lo escribes, también le llegará la confirmación." wide>
        <input type="email" inputMode="email" className={inputClass} value={values.guestEmail} onChange={(e) => set("guestEmail", e.target.value)} />
      </Field>

      <div className="mt-1 flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end md:col-span-2">
        {onCancelMeeting && (
          <button
            type="button"
            onClick={onCancelMeeting}
            className="h-11 rounded-[10px] border border-danger-bd px-4 text-sm font-medium text-danger hover:bg-danger-soft"
          >
            Cancelar reunión
          </button>
        )}
        <button type="button" onClick={onClose} className="h-11 rounded-[10px] border border-border px-4 text-sm font-medium text-text-2 hover:bg-surface-2">
          Volver
        </button>
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-[10px] bg-brand px-5 text-sm font-semibold text-brand-ink hover:brightness-110 disabled:opacity-60"
        >
          {busy ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, hint, wide, children }: { label: string; error?: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? "md:col-span-2" : ""}`}>
      <span className="text-sm font-medium text-text-2">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
      {error && <span role="alert" className="text-sm text-danger">{error}</span>}
    </label>
  );
}
