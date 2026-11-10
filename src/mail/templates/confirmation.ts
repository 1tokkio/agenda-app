import type { EventConfig } from "@config/event";
import type { MailMessage } from "../provider";
import { formatDayLong, formatHour } from "@/lib/format";

export type ConfirmationData = {
  to: string;
  title: string;
  requesterName: string;
  requesterCompany: string;
  targetName: string;
  roomName: string;
  startsAt: Date;
  endsAt: Date;
  /** Página para cancelar la reunión. Sin ella, el correo indica escribir a la organización. */
  cancelUrl?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Tonos fijos del correo que no están en el tema: fondo exterior, líneas y fondo del bloque de fecha.
const OUTER_BG = "#f1f5f9";
const LINE = "#e2e8f0";
const SOFT_BG = "#eef3fa";

/** Correo de confirmación. Los colores salen del tema de config/event.ts. */
export function renderConfirmation(data: ConfirmationData, cfg: EventConfig): MailMessage {
  const { colors, radius, fonts } = cfg.theme;
  const day = formatDayLong(
    new Intl.DateTimeFormat("en-CA", { timeZone: cfg.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(data.startsAt),
    cfg.timezone,
  );
  const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);
  const time = `${formatHour(data.startsAt, cfg.timezone)} – ${formatHour(data.endsAt, cfg.timezone)}`;
  const minutes = Math.round((data.endsAt.getTime() - data.startsAt.getTime()) / 60_000);
  const subject = `Reunión confirmada · ${data.title}`;

  const rows: [string, string][] = [
    ["Asunto", data.title],
    ["Participantes", `${data.requesterCompany} y ${data.targetName}`],
    ["Lugar", data.roomName],
    ["Agendada por", data.requesterName],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
              <tr>
                <td style="padding:12px 16px 12px 0;color:${colors.textMuted};width:34%;vertical-align:top;border-bottom:1px solid ${LINE};">${escapeHtml(label)}</td>
                <td style="padding:12px 0;color:${colors.text};font-weight:600;vertical-align:top;border-bottom:1px solid ${LINE};">${escapeHtml(value)}</td>
              </tr>`,
    )
    .join("");

  const cancelHtml = data.cancelUrl
    ? `
            <p style="margin:28px 0 12px;color:${colors.text};font-size:15px;">¿No podrás asistir? Cancela la reunión y el horario quedará libre para otra persona.</p>
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border:1px solid ${colors.danger};border-radius:10px;">
                  <a href="${escapeHtml(data.cancelUrl)}" style="display:inline-block;padding:11px 20px;color:${colors.danger};font-size:14px;font-weight:600;text-decoration:none;">Cancelar reunión</a>
                </td>
              </tr>
            </table>
            <p style="margin:12px 0 0;color:${colors.textMuted};font-size:12px;word-break:break-all;">Si el botón no funciona, copia este enlace en tu navegador: ${escapeHtml(data.cancelUrl)}</p>`
    : `
            <p style="margin:28px 0 0;color:${colors.textMuted};font-size:13px;">Si necesitas cancelar, escribe al equipo de organización.</p>`;

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px 12px;background:${OUTER_BG};font-family:${fonts.body};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:${colors.surface};border-radius:${radius};overflow:hidden;">
      <tr>
        <td style="padding:18px 32px;background:${colors.primary};color:#ffffff;font-size:14px;font-weight:700;">${escapeHtml(cfg.name)} · ${escapeHtml(cfg.subtitle)}</td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <h1 style="margin:0 0 8px;color:${colors.text};font-size:24px;font-family:${fonts.heading};">Tu reunión está confirmada</h1>
          <p style="margin:0 0 24px;color:${colors.textMuted};font-size:15px;">Guarda este correo: aquí están los datos de la reunión.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SOFT_BG};border-radius:12px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0;color:${colors.primary};font-size:17px;font-weight:700;">${escapeHtml(dayLabel)}</p>
                <p style="margin:4px 0 0;color:${colors.primary};font-size:15px;">${escapeHtml(time)} · ${minutes} min</p>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-collapse:collapse;font-size:15px;">${tableRows}
          </table>${cancelHtml}
        </td>
      </tr>
      <tr>
        <td style="padding:16px 32px;border-top:1px solid ${LINE};color:${colors.textMuted};font-size:12px;">Recibiste este correo porque se agendó una reunión con esta dirección en ${escapeHtml(cfg.name)}.</td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `${cfg.name} · ${cfg.subtitle}: tu reunión está confirmada`,
    "",
    `${dayLabel}, ${time} (${minutes} min)`,
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    data.cancelUrl
      ? `¿No podrás asistir? Cancela la reunión aquí y el horario quedará libre: ${data.cancelUrl}`
      : "Si necesitas cancelar, escribe al equipo de organización.",
  ].join("\n");

  return { to: data.to, subject, html, text };
}
