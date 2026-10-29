"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/lib/config";

type Profile = {
  name: string;
  email: string;
  username: string;
  companyId: string;
  jobTitle: string | null;
  phone: string | null;
  companyName: string | null;
};

/** Valores del formulario: los opcionales se editan como texto (vacío = sin dato). */
type Values = { name: string; email: string; jobTitle: string; phone: string; companyName: string };
type FieldName = keyof Values;

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-surface px-3.5 text-base text-text placeholder:text-muted focus:outline-2 focus:outline-offset-[-1px] focus:outline-brand disabled:opacity-60 md:text-sm";

/** Perfil del usuario: datos de contacto que completa cada persona. La empresa asignada la define el admin. */
export function ProfileDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [values, setValues] = useState<Values>({ name: "", email: "", jobTitle: "", phone: "", companyName: "" });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/profile", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ profile?: Profile; error?: string }>)
      .then((body) => {
        if (!active) return;
        if (body.profile) {
          setProfile(body.profile);
          setValues({
            name: body.profile.name,
            email: body.profile.email,
            jobTitle: body.profile.jobTitle ?? "",
            phone: body.profile.phone ?? "",
            companyName: body.profile.companyName ?? "",
          });
        } else {
          setMessage({ kind: "error", text: body.error ?? "No se pudo cargar tu perfil." });
        }
      })
      .catch(() => {
        if (active) setMessage({ kind: "error", text: "Sin conexión con el servidor." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const assignedCompany = profile ? config.companies.find((c) => c.id === profile.companyId)?.name : undefined;

  function update(field: FieldName) {
    return (event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [field]: event.target.value }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setErrors({});
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await response.json().catch(() => null)) as {
        profile?: Profile;
        error?: string;
        fields?: Partial<Record<FieldName, string>>;
      } | null;
      if (response.ok && body?.profile) {
        setProfile(body.profile);
        setMessage({ kind: "ok", text: "Perfil guardado." });
        router.refresh();
        return;
      }
      setErrors(body?.fields ?? {});
      setMessage({ kind: "error", text: body?.error ?? "No se pudo guardar el perfil." });
    } catch {
      setMessage({ kind: "error", text: "Sin conexión con el servidor. Inténtalo de nuevo." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-gray-900/50 md:items-center md:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[20px] bg-surface md:max-w-[480px] md:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex flex-col gap-1">
            <h2 id="profile-title" className="text-xl font-medium text-text" style={{ fontFamily: "var(--font-display)" }}>
              Mi perfil
            </h2>
            {profile && <p className="text-sm text-muted">@{profile.username}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar perfil"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-border text-text-2 hover:bg-surface-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {loading ? (
          <p className="px-6 py-10 text-center text-sm text-muted">Cargando tu perfil…</p>
        ) : (
          <form onSubmit={save} className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
            <Field label="Nombre" error={errors.name}>
              <input className={inputClass} value={values.name} onChange={update("name")} required />
            </Field>
            <Field label="Correo" error={errors.email}>
              <input type="email" className={inputClass} value={values.email} onChange={update("email")} required />
            </Field>
            <Field label="Cargo" error={errors.jobTitle}>
              <input className={inputClass} value={values.jobTitle} onChange={update("jobTitle")} placeholder="Ej.: Gerente comercial" />
            </Field>
            <Field label="Teléfono de contacto" error={errors.phone}>
              <input type="tel" className={inputClass} value={values.phone} onChange={update("phone")} placeholder="+56 9 1234 5678" />
            </Field>
            <Field label="Nombre de la empresa" error={errors.companyName}>
              <input className={inputClass} value={values.companyName} onChange={update("companyName")} placeholder="Razón social o nombre visible" />
            </Field>

            {assignedCompany && (
              <p className="rounded-[10px] border border-border bg-surface-2 px-3.5 py-3 text-sm text-text-2">
                Empresa asignada en el evento: <span className="font-medium text-text">{assignedCompany}</span>. Para cambiarla, escribe al administrador.
              </p>
            )}

            {message && (
              <p role={message.kind === "error" ? "alert" : "status"} className={message.kind === "error" ? "text-sm text-danger" : "text-sm text-ok"}>
                {message.text}
              </p>
            )}

            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-[10px] border border-border px-4 text-sm font-medium text-text-2 hover:bg-surface-2"
              >
                Cerrar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-11 rounded-[10px] bg-brand px-5 text-sm font-semibold text-brand-ink hover:brightness-110 disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-text-2">
      {label}
      {children}
      {error && (
        <span role="alert" className="text-xs font-normal text-danger">
          {error}
        </span>
      )}
    </label>
  );
}
