"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
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
  "h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Formulario de agendamiento. Lo usan el tótem, el sitio y el panel de admin. */
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

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await onSubmit({ ...values, date, time });
    if (result.ok) {
      onDone(result.value);
    } else {
      setErrors(result.errors);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {initial ? "Editar reunión" : "Agendar reunión"}
        </h2>
        <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
          {formatDayLabel(date)} · {time} – {endTime(time)} · Sala única
        </p>
        {errors.time && <p role="alert" className="mt-2 text-sm text-error-600">{errors.time}</p>}
        {errors.date && <p role="alert" className="mt-2 text-sm text-error-600">{errors.date}</p>}
      </div>

      <Field label="Tu nombre" error={errors.requesterName}>
        <input className={inputClass} value={values.requesterName} onChange={(e) => set("requesterName", e.target.value)} autoComplete="name" />
      </Field>

      <Field label="Tu empresa" error={errors.requesterCompany}>
        <input className={inputClass} value={values.requesterCompany} onChange={(e) => set("requesterCompany", e.target.value)} autoComplete="organization" />
      </Field>

      <Field label="Título de la reunión" error={errors.title}>
        <input className={inputClass} value={values.title} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder="Ej.: Presentación de catálogo" />
      </Field>

      <Field label="¿Con qué empresa te quieres reunir?" error={errors.targetCompanyId}>
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

      <Field label="Correo de la otra persona (opcional)" error={errors.guestEmail} hint="Si lo escribes, también le llegará la notificación.">
        <input type="email" inputMode="email" className={inputClass} value={values.guestEmail} onChange={(e) => set("guestEmail", e.target.value)} />
      </Field>

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancelMeeting && (
          <Button variant="danger" onClick={onCancelMeeting} className="min-h-12">
            Cancelar reunión
          </Button>
        )}
        <Button variant="outline" onClick={onClose} className="min-h-12">
          Volver
        </Button>
        <Button type="submit" className="min-h-12">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-gray-500 dark:text-gray-400">{hint}</span>}
      {error && <span role="alert" className="text-sm text-error-600">{error}</span>}
    </label>
  );
}
