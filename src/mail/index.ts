import { ConsoleMailProvider } from "./console-provider";
import { ResendMailProvider } from "./resend-provider";
import type { MailMessage, MailProvider } from "./provider";

export type { MailMessage, MailProvider } from "./provider";

/**
 * Proveedor de correo según MAIL_PROVIDER:
 * - "resend": envía con la API de Resend (producción). Requiere RESEND_API_KEY y MAIL_FROM.
 * - "console": escribe los correos en consola y en OUTBOX_DIR (desarrollo).
 * En producción el valor por defecto es "resend"; en desarrollo, "console".
 * Si Resend no está configurado, la reserva igual se guarda y el correo queda como no enviado.
 */
export function getMailProvider(): MailProvider {
  const kind = process.env.MAIL_PROVIDER ?? (process.env.NODE_ENV === "production" ? "resend" : "console");

  if (kind === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;
    if (!apiKey || !from) {
      return {
        name: "resend-sin-configurar",
        async send(): Promise<void> {
          throw new Error("Resend no está configurado: falta RESEND_API_KEY o MAIL_FROM");
        },
      } satisfies MailProvider & { send(message: MailMessage): Promise<void> };
    }
    return new ResendMailProvider(apiKey, from);
  }

  return new ConsoleMailProvider();
}
