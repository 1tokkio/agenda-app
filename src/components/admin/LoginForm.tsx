"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  eventName: string;
  subtitle?: string;
  logoText?: string;
};

const inputClass =
  "h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Ingreso al panel con usuario y contraseña del personal. Diseño inspirado en la pantalla de login de referencia. */
export function LoginForm({ eventName, subtitle, logoText }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const body = (await response.json().catch(() => null)) as { role?: string } | null;
        router.replace(body?.role === "admin" ? "/admin" : "/");
        router.refresh();
        return;
      }
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "No se pudo iniciar sesión.");
    } catch {
      setError("Sin conexión con el servidor. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div
            className="app-logo flex h-12 w-12 items-center justify-center rounded-xl text-base font-bold text-white shadow-theme-xs"
            style={{ background: "var(--app-primary)" }}
            aria-hidden="true"
          >
            {(logoText ?? eventName).slice(0, 2).toUpperCase()}
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white/90">{eventName}</h1>
          {subtitle && (
            <p className="mt-1 text-xs tracking-[0.2em] text-gray-500 uppercase dark:text-gray-400">{subtitle}</p>
          )}
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Bienvenido. Ingresa con el usuario que te asignó la organización.</p>
        </div>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Usuario</span>
            <input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              placeholder="Tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</span>
            <span className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={cn(inputClass, "pe-11")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <EyeIcon open={showPassword} />
              </button>
            </span>
          </label>

          <p className="text-end text-xs text-gray-500 dark:text-gray-400">¿No tienes acceso? Pídelo a la organización.</p>

          {error && (
            <p role="alert" className="text-sm text-error-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || username.length === 0 || password.length === 0}
            className={cn(
              "h-12 w-full rounded-lg text-sm font-semibold text-white shadow-theme-xs transition",
              "bg-brand-500 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {busy ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          Acceso restringido al personal de las empresas participantes.
        </p>
      </div>
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      {!open && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}
