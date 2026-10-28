"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import ComponentCard from "@/components/common/ComponentCard";
import { COMPANIES, MAX_USERS, companyById } from "./data";
import type { FieldErrors } from "@/lib/booking-rules";
import { useAgenda } from "./store";

const inputClass =
  "h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-800 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/** Usuarios del personal de las empresas (máximo 30). */
export function UsersAdmin() {
  const { users, addUser, removeUser } = useAgenda();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState(COMPANIES[0].id);
  const [errors, setErrors] = useState<FieldErrors>({});
  const full = users.length >= MAX_USERS;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = await addUser({ name, email, companyId });
    if (result.ok) {
      setName("");
      setEmail("");
      setErrors({});
    } else {
      setErrors(result.errors);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <ComponentCard title="Crear usuario" desc={`${users.length} de ${MAX_USERS} usuarios creados`}>
        <form onSubmit={submit} className="flex flex-col gap-4 p-5 sm:p-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${(users.length / MAX_USERS) * 100}%` }} />
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</span>
            <input disabled={full} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            {errors.requesterName && <span role="alert" className="text-sm text-error-600">{errors.requesterName}</span>}
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Correo</span>
            <input type="email" disabled={full} className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            {errors.requesterEmail && <span role="alert" className="text-sm text-error-600">{errors.requesterEmail}</span>}
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</span>
            <select disabled={full} className={inputClass} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              {COMPANIES.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={full} className="min-h-12">
            {full ? `Límite de ${MAX_USERS} usuarios alcanzado` : "Crear usuario"}
          </Button>
        </form>
      </ComponentCard>

      <ComponentCard title="Usuarios" desc="Personal de las empresas con acceso al panel">
        {users.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">Aún no hay usuarios.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/5">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-800 dark:text-white/90">{u.name}</p>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge size="sm" color="primary">{companyById(u.companyId)?.name}</Badge>
                  <Button size="sm" variant="outline" onClick={() => removeUser(u.id)}>Quitar</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ComponentCard>
    </div>
  );
}
