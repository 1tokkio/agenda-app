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
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Correo de confirmación. Los colores salen del tema de config/event.ts. */
export function renderConfirmation(data: ConfirmationData, cfg: EventConfig): MailMessage {
  const { colors, radius } = cfg.theme;
  const day = formatDayLong(
    new Intl.DateTimeFormat("en-CA", { timeZone: cfg.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(data.startsAt),
    cfg.timezone,
  );
  const time = `${formatHour(data.startsAt, cfg.timezone)} – ${formatHour(data.endsAt, cfg.timezone)}`;
  const subject = `Reunión confirmada · ${data.title}`;

  const rows: [string, string][] = [
    ["Fecha", day],
    ["Horario", time],
    ["Lugar", data.roomName],
    ["Título", data.title],
    ["Empresa con la que te reúnes", data.targetName],
    ["Solicitante", `${data.requesterName} (${data.requesterCompany})`],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
          <tr>
            <td style="padding:10px 0;color:${colors.textMuted};width:40%;border-bottom:1px solid #e2e8f0;">${escapeHtml(label)}</td>
            <td style="padding:10px 0;color:${colors.text};font-weight:600;border-bottom:1px solid #e2e8f0;">${escapeHtml(value)}</td>
          </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:24px;background:${colors.background};font-family:${cfg.theme.fonts.body};">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:${colors.surface};border-radius:${radius};padding:32px;">
      <tr><td>
        <p style="margin:0 0 8px;color:${colors.primary};font-weight:700;">${escapeHtml(cfg.name)} · ${escapeHtml(cfg.subtitle)}</p>
        <h1 style="margin:0 0 24px;color:${colors.text};font-size:24px;">Tu reunión está confirmada</h1>
        <table role="presentation" width="100%" style="border-collapse:collapse;font-size:15px;">${tableRows}
        </table>
        <p style="margin:28px 0 0;color:${colors.textMuted};font-size:13px;">
          Si necesitas cancelar, escribe al equipo de organización.
        </p>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = [
    `${cfg.name} · ${cfg.subtitle}: tu reunión está confirmada`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Si necesitas cancelar, escribe al equipo de organización.",
  ].join("\n");

  return { to: data.to, subject, html, text };
}
