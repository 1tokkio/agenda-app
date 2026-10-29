/*
 * Cuentas de acceso en Supabase Authentication.
 * Cada usuario tiene una cuenta con su correo y contraseña, y su perfil va en los metadatos de la cuenta.
 * La tabla staff_users de la app guarda el mismo id y se mantiene sincronizada.
 * La clave service role solo se usa en el servidor (SUPABASE_SERVICE_ROLE_KEY).
 */

export type AccountMetadata = {
  username: string;
  name: string;
  role: string;
  companyId: string;
  companyName: string | null;
  jobTitle: string | null;
  phone: string | null;
};

export interface AccountProvider {
  create(input: { email: string; password: string; metadata: AccountMetadata }): Promise<string>;
  update(id: string, input: { email?: string; password?: string; metadata?: AccountMetadata }): Promise<void>;
  remove(id: string): Promise<void>;
  signIn(email: string, password: string): Promise<boolean>;
}

export class AccountError extends Error {
  constructor(
    readonly code: "EMAIL_TAKEN" | "UNAVAILABLE",
    message: string,
  ) {
    super(message);
    this.name = "AccountError";
  }
}

/** Cuentas en Supabase Authentication, por la API de administración de la URL del proyecto. */
export function supabaseAccounts(): AccountProvider {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const notConfigured = (): never => {
    throw new AccountError("UNAVAILABLE", "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor");
  };
  if (!url || !key) {
    return {
      create: async () => notConfigured(),
      update: async () => notConfigured(),
      remove: async () => notConfigured(),
      signIn: async () => notConfigured(),
    };
  }

  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const call = (path: string, init: RequestInit) => fetch(`${url}${path}`, { ...init, headers: { ...headers, ...init.headers } });

  return {
    async create({ email, password, metadata }) {
      const response = await call("/auth/v1/admin/users", {
        method: "POST",
        body: JSON.stringify({ email, password, email_confirm: true, user_metadata: metadata }),
      });
      const body = (await response.json().catch(() => null)) as { id?: string; error_code?: string; msg?: string; message?: string } | null;
      if (!response.ok || !body?.id) {
        if (body?.error_code === "email_exists") throw new AccountError("EMAIL_TAKEN", "Ese correo ya tiene una cuenta de acceso");
        throw new AccountError("UNAVAILABLE", body?.msg ?? body?.message ?? "No se pudo crear la cuenta de acceso");
      }
      return body.id;
    },

    async update(id, input) {
      const payload: Record<string, unknown> = {};
      if (input.email !== undefined) {
        payload.email = input.email;
        payload.email_confirm = true;
      }
      if (input.password !== undefined) payload.password = input.password;
      if (input.metadata !== undefined) payload.user_metadata = input.metadata;
      const response = await call(`/auth/v1/admin/users/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error_code?: string; msg?: string; message?: string } | null;
        if (body?.error_code === "email_exists") throw new AccountError("EMAIL_TAKEN", "Ese correo ya tiene una cuenta de acceso");
        throw new AccountError("UNAVAILABLE", body?.msg ?? body?.message ?? "No se pudo actualizar la cuenta de acceso");
      }
    },

    async remove(id) {
      const response = await call(`/auth/v1/admin/users/${id}`, { method: "DELETE" });
      // Si la cuenta ya no existe, el resultado es el mismo: se considera quitada.
      if (!response.ok && response.status !== 404) {
        throw new AccountError("UNAVAILABLE", "No se pudo quitar la cuenta de acceso");
      }
    },

    async signIn(email, password) {
      const response = await call("/auth/v1/token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return response.ok;
    },
  };
}
