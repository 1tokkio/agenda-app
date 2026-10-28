import { z } from "zod";
import { eventConfig, type EventConfig } from "@config/event";

/*
 * La configuración se valida al arrancar. Un error de tipeo en config/event.ts
 * (un horario mal escrito, un id repetido) falla aquí con un mensaje claro,
 * en vez de producir reservas raras más tarde.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "usar formato YYYY-MM-DD");
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "usar formato HH:mm");
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "usar color hex #rrggbb");
const slug = z.string().regex(/^[a-z0-9-]+$/, "usar minúsculas, números y guiones");

const schema = z
  .object({
    name: z.string().min(1),
    subtitle: z.string(),
    logoText: z.string().min(1).max(3),
    timezone: z.string().min(1),
    dates: z.object({ start: isoDate, end: isoDate }),
    schedule: z.object({
      slotMinutes: z.number().int().positive(),
      days: z
        .array(z.object({ date: isoDate, start: clock, end: clock }))
        .min(1),
    }),
    rooms: z
      .array(
        z.object({
          id: slug,
          name: z.string().min(1),
          capacity: z.number().int().positive(),
        }),
      )
      .min(1),
    companies: z
      .array(
        z.object({
          id: slug,
          name: z.string().min(1),
          color: hexColor,
          logoUrl: z.string().optional(),
        }),
      )
      .min(1),
    maxUsers: z.number().int().positive(),
    idleResetSeconds: z.number().int().positive(),
    theme: z.object({
      colors: z.record(z.string(), z.string()),
      fonts: z.record(z.string(), z.string()),
      radius: z.string(),
    }),
  })
  .superRefine((cfg, ctx) => {
    const unique = (ids: string[], label: string) => {
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({ code: "custom", message: `ids de ${label} repetidos` });
      }
    };
    unique(cfg.rooms.map((r) => r.id), "salas");
    unique(cfg.companies.map((c) => c.id), "empresas");

    for (const day of cfg.schedule.days) {
      if (day.end <= day.start) {
        ctx.addIssue({
          code: "custom",
          message: `el día ${day.date} termina antes de empezar`,
        });
      }
      if (day.date < cfg.dates.start || day.date > cfg.dates.end) {
        ctx.addIssue({
          code: "custom",
          message: `el día ${day.date} está fuera de las fechas del evento`,
        });
      }
    }
  });

function validate(cfg: EventConfig): EventConfig {
  const result = schema.safeParse(cfg);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(raíz)"}: ${i.message}`)
      .join("\n");
    throw new Error(`config/event.ts no es válida:\n${details}`);
  }
  return cfg;
}

export const config: EventConfig = validate(eventConfig);
