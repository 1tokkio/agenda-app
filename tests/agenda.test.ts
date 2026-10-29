import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  BookingError,
  authenticateStaff,
  blockSlot,
  cancelMeeting,
  createMeeting,
  createStaffUser,
  deleteStaffUser,
  getProfile,
  updateProfile,
  listAgenda,
  listStaffUsers,
  unblockSlot,
  updateMeeting,
} from "../src/lib/bookings";
import { config } from "../src/lib/config";
import { slotsForDay } from "../src/lib/slots";
import { formatHour } from "../src/lib/format";
import { createTestContext } from "./helpers";
import type { BookingInput } from "../src/lib/booking-rules";

const DAY = config.schedule.days[0].date;
const SLOTS = slotsForDay(DAY, config);
const time = (i: number) => formatHour(new Date(SLOTS[i].startsAt), config.timezone);

let ctx: Awaited<ReturnType<typeof createTestContext>>;

beforeEach(async () => {
  ctx = await createTestContext();
});

afterEach(async () => {
  await ctx.close();
});

/** Datos válidos de una reunión; cada prueba cambia solo lo que necesita. */
function input(overrides: Partial<BookingInput> = {}): BookingInput {
  return {
    date: DAY,
    time: time(0),
    title: "Presentación de catálogo",
    requesterName: "Camila Rojas",
    requesterCompany: "Distribuidora Norte",
    targetCompanyId: "empresa-a",
    requesterEmail: "camila@ejemplo.cl",
    ...overrides,
  };
}

async function expectError(promise: Promise<unknown>, code: BookingError["code"]) {
  const err = await promise.then(
    () => {
      throw new Error("se esperaba un error y no hubo");
    },
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(BookingError);
  expect((err as BookingError).code).toBe(code);
  return err as BookingError;
}

describe("reserva válida", () => {
  it("crea la reunión y envía la confirmación a quien agenda", async () => {
    const { meeting, mailSent } = await createMeeting(ctx, input());

    expect(meeting.targetCompanyId).toBe("empresa-a");
    expect(mailSent).toBe(true);
    expect(ctx.mail.sent.map((m) => m.to)).toEqual(["camila@ejemplo.cl"]);
    expect(ctx.mail.sent[0].html).toContain("Presentación de catálogo");
  });

  it("envía también la confirmación a la otra persona si se indicó su correo", async () => {
    await createMeeting(ctx, input({ guestEmail: "gerencia@ejemplo.cl" }));
    expect(ctx.mail.sent.map((m) => m.to)).toEqual(["camila@ejemplo.cl", "gerencia@ejemplo.cl"]);
  });

  it("si el correo falla, la reunión se mantiene", async () => {
    ctx.mail.shouldFail = true;
    const { meeting, mailSent } = await createMeeting(ctx, input());

    expect(mailSent).toBe(false);
    expect((await listAgenda(ctx, { full: true })).meetings.map((m) => m.id)).toContain(meeting.id);
  });
});

describe("doble reserva y horario ocupado", () => {
  it("rechaza otra reunión en el mismo bloque, aunque sea de otra empresa", async () => {
    await createMeeting(ctx, input());
    await expectError(createMeeting(ctx, input({ targetCompanyId: "empresa-b" })), "CONFLICT");
  });

  it("la base rechaza la doble reserva aunque se salte el servicio", async () => {
    await createMeeting(ctx, input());
    const insert = ctx.client.query(
      "INSERT INTO bookings (id, room_id, target_company_id, title, requester_name, requester_company, requester_email, starts_at, ends_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      ["manual", "sala-unica", "empresa-b", "Manual", "X", "Y", "x@y.cl", new Date(SLOTS[0].startsAt), new Date(SLOTS[0].endsAt)],
    );
    await expect(insert).rejects.toThrow(/unique|duplicate/i);
  });

  it("no agenda dos reuniones para la misma empresa a la misma hora", async () => {
    await createMeeting(ctx, input({ targetCompanyId: "empresa-c" }));
    await expectError(createMeeting(ctx, input({ targetCompanyId: "empresa-c", time: time(0) })), "CONFLICT");
  });
});

describe("validaciones", () => {
  it("rechaza un horario que no es bloque del evento", async () => {
    await expectError(createMeeting(ctx, input({ time: "10:15" })), "INVALID");
  });

  it("rechaza un correo inválido y lo indica en el campo", async () => {
    const err = await expectError(createMeeting(ctx, input({ requesterEmail: "no-es-correo" })), "INVALID");
    expect(err.fields?.requesterEmail).toBeTruthy();
  });

  it("rechaza que el correo de la otra persona sea el mismo que el de quien agenda", async () => {
    const err = await expectError(createMeeting(ctx, input({ guestEmail: "camila@ejemplo.cl" })), "INVALID");
    expect(err.fields?.guestEmail).toBeTruthy();
  });

  it("exige un título de al menos 3 caracteres", async () => {
    const err = await expectError(createMeeting(ctx, input({ title: "ab" })), "INVALID");
    expect(err.fields?.title).toBeTruthy();
  });
});

describe("bloqueos", () => {
  it("no permite reservar un horario bloqueado", async () => {
    await blockSlot(ctx, { date: DAY, time: time(2), reason: "Pausa de publicidad" });
    await expectError(createMeeting(ctx, input({ time: time(2) })), "CONFLICT");
  });

  it("no permite bloquear un horario que ya tiene reunión", async () => {
    await createMeeting(ctx, input({ time: time(3) }));
    await expect(blockSlot(ctx, { date: DAY, time: time(3), reason: "Publicidad" })).rejects.toBeInstanceOf(BookingError);
  });

  it("al liberar el bloqueo el horario vuelve a estar disponible", async () => {
    const block = await blockSlot(ctx, { date: DAY, time: time(4), reason: "Mantención" });
    await unblockSlot(ctx, block.id);
    const { meeting } = await createMeeting(ctx, input({ time: time(4) }));
    expect(meeting.time).toBe(time(4));
  });
});

describe("cancelación y edición", () => {
  it("cancelar libera el horario", async () => {
    const { meeting } = await createMeeting(ctx, input());
    await cancelMeeting(ctx, meeting.id);
    const again = await createMeeting(ctx, input());
    expect(again.meeting.time).toBe(time(0));
    expect((await listAgenda(ctx, { full: true })).meetings).toHaveLength(1);
  });

  it("editar una reunión a un horario ocupado falla", async () => {
    await createMeeting(ctx, input({ time: time(0) }));
    const { meeting } = await createMeeting(ctx, input({ time: time(1), targetCompanyId: "empresa-d" }));
    await expectError(updateMeeting(ctx, meeting.id, input({ time: time(0), targetCompanyId: "empresa-d" })), "CONFLICT");
  });

  it("editar una reunión a un horario libre la mueve", async () => {
    const { meeting } = await createMeeting(ctx, input({ time: time(0) }));
    const updated = await updateMeeting(ctx, meeting.id, input({ time: time(5), title: "Nuevo título" }));
    expect(updated.time).toBe(time(5));
    expect((await listAgenda(ctx, { full: true })).meetings[0].title).toBe("Nuevo título");
  });
});

/** Datos válidos de un usuario del personal; cada prueba cambia solo lo que necesita. */
function staff(overrides: Partial<Parameters<typeof createStaffUser>[1]> = {}) {
  return {
    name: "Ana Pérez",
    email: "ana@empresa.cl",
    username: "ana.perez",
    password: "clave-segura-2026",
    companyId: "empresa-a",
    ...overrides,
  };
}

describe("usuarios del personal", () => {
  it("no permite crear más de 30 usuarios", async () => {
    for (let i = 0; i < 30; i++) {
      await createStaffUser(ctx, staff({ name: `Persona ${i}`, email: `p${i}@empresa.cl`, username: `persona${i}` }));
    }
    expect(await listStaffUsers(ctx)).toHaveLength(30);
    await expect(createStaffUser(ctx, staff({ email: "extra@empresa.cl", username: "extra" }))).rejects.toBeInstanceOf(BookingError);
  });

  it("no permite dos usuarios con el mismo correo", async () => {
    await createStaffUser(ctx, staff());
    await expect(createStaffUser(ctx, staff({ username: "ana.2", companyId: "empresa-b" }))).rejects.toBeInstanceOf(BookingError);
  });

  it("no permite dos usuarios con el mismo nombre de usuario, sin distinguir mayúsculas", async () => {
    await createStaffUser(ctx, staff());
    await expect(createStaffUser(ctx, staff({ email: "otra@empresa.cl", username: "Ana.Perez" }))).rejects.toBeInstanceOf(BookingError);
  });

  it("valida el nombre de usuario y la contraseña mínima", async () => {
    const badUser = await createStaffUser(ctx, staff({ username: "ab" })).catch((e: unknown) => e);
    expect((badUser as BookingError).fields?.username).toBeTruthy();
    const shortPassword = await createStaffUser(ctx, staff({ password: "corta" })).catch((e: unknown) => e);
    expect((shortPassword as BookingError).fields?.password).toBeTruthy();
  });

  it("guarda la contraseña como hash, nunca en claro, y no la devuelve en el listado", async () => {
    await createStaffUser(ctx, staff());
    const raw = await ctx.client.query<{ password_hash: string }>("SELECT password_hash FROM staff_users");
    expect(raw.rows[0].password_hash).not.toContain("clave-segura-2026");
    expect(raw.rows[0].password_hash.startsWith("scrypt$")).toBe(true);
    expect(Object.keys((await listStaffUsers(ctx))[0])).not.toContain("passwordHash");
  });
});

describe("roles de acceso", () => {
  it("un usuario nuevo es usuario común salvo que se indique administrador", async () => {
    const common = await createStaffUser(ctx, staff());
    const admin = await createStaffUser(ctx, staff({ email: "admin@empresa.cl", username: "admin.uno", role: "admin" }));
    expect(common.role).toBe("member");
    expect(admin.role).toBe("admin");
    expect((await authenticateStaff(ctx, "admin.uno", "clave-segura-2026"))?.role).toBe("admin");
  });

  it("no permite quitarse a sí mismo", async () => {
    const admin = await createStaffUser(ctx, staff({ role: "admin" }));
    await expect(deleteStaffUser(ctx, admin.id, admin.id)).rejects.toBeInstanceOf(BookingError);
  });

  it("no deja el panel sin administradores", async () => {
    const admin = await createStaffUser(ctx, staff({ role: "admin" }));
    const other = await createStaffUser(ctx, staff({ email: "otro@empresa.cl", username: "otro", role: "member" }));
    await expect(deleteStaffUser(ctx, admin.id, other.id)).rejects.toBeInstanceOf(BookingError);
    const second = await createStaffUser(ctx, staff({ email: "dos@empresa.cl", username: "admin.dos", role: "admin" }));
    await deleteStaffUser(ctx, admin.id, second.id);
    expect((await listStaffUsers(ctx)).map((u) => u.id)).not.toContain(admin.id);
  });

  it("un administrador puede quitar a un usuario común", async () => {
    const admin = await createStaffUser(ctx, staff({ role: "admin" }));
    const common = await createStaffUser(ctx, staff({ email: "c@empresa.cl", username: "comun", role: "member" }));
    await deleteStaffUser(ctx, common.id, admin.id);
    expect((await listStaffUsers(ctx)).map((u) => u.id)).toEqual([admin.id]);
  });
});

describe("perfil del usuario", () => {
  it("guarda cargo, teléfono y nombre de empresa, y los campos vacíos quedan sin valor", async () => {
    const user = await createStaffUser(ctx, staff());
    const saved = await updateProfile(ctx, user.id, {
      name: "Ana Pérez Soto",
      email: "ana@empresa.cl",
      jobTitle: " Gerente comercial ",
      phone: "+56 9 1234 5678",
      companyName: "Distribuidora Norte SpA",
    });
    expect(saved.jobTitle).toBe("Gerente comercial");
    expect((await getProfile(ctx, user.id)).companyName).toBe("Distribuidora Norte SpA");

    const cleared = await updateProfile(ctx, user.id, { name: "Ana Pérez Soto", email: "ana@empresa.cl", jobTitle: "", phone: "", companyName: "" });
    expect(cleared.phone).toBeNull();
    expect(cleared.companyName).toBeNull();
  });

  it("valida el teléfono y el correo, y no permite un correo ya usado por otro usuario", async () => {
    const ana = await createStaffUser(ctx, staff());
    await createStaffUser(ctx, staff({ email: "luis@empresa.cl", username: "luis.perez" }));
    const badPhone = await updateProfile(ctx, ana.id, { name: "Ana", email: "ana@empresa.cl", jobTitle: "", phone: "abc", companyName: "" }).catch((e: unknown) => e);
    expect((badPhone as BookingError).fields?.phone).toBeTruthy();
    const taken = await updateProfile(ctx, ana.id, { name: "Ana", email: "luis@empresa.cl", jobTitle: "", phone: "", companyName: "" }).catch((e: unknown) => e);
    expect((taken as BookingError).code).toBe("CONFLICT");
  });
});

describe("inicio de sesión del personal", () => {
  it("entra con usuario y contraseña correctos, sin distinguir mayúsculas en el usuario", async () => {
    const created = await createStaffUser(ctx, staff());
    const user = await authenticateStaff(ctx, "ANA.perez", "clave-segura-2026");
    expect(user?.id).toBe(created.id);
    expect(user?.username).toBe("ana.perez");
  });

  it("rechaza una contraseña incorrecta o un usuario que no existe", async () => {
    await createStaffUser(ctx, staff());
    expect(await authenticateStaff(ctx, "ana.perez", "otra-clave-larga")).toBeNull();
    expect(await authenticateStaff(ctx, "nadie", "clave-segura-2026")).toBeNull();
  });
});

describe("agenda pública", () => {
  it("no muestra nombres ni correos de quien agendó", async () => {
    await createMeeting(ctx, input({ guestEmail: "gerencia@ejemplo.cl" }));
    const pub = (await listAgenda(ctx, { full: false })).meetings[0];
    expect(pub.requesterEmail).toBe("");
    expect(pub.requesterName).toBe("");
    expect(pub.guestEmail).toBeUndefined();
    expect(pub.title).toBe("Presentación de catálogo");
  });

  it("la agenda incluye los bloqueos", async () => {
    const block = await blockSlot(ctx, { date: DAY, time: time(6), reason: "Pausa" });
    expect((await listAgenda(ctx, { full: false })).blocks.map((b) => b.id)).toEqual([block.id]);
  });
});
