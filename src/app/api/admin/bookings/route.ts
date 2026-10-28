import { NextResponse } from "next/server";
import { companyNames, listAgenda } from "@/lib/bookings";
import { toCsv } from "@/lib/csv";
import { requireAdminApi } from "@/lib/admin-auth";
import { defaultContext } from "@/lib/context";

export const dynamic = "force-dynamic";

/** Exporta las reuniones confirmadas a CSV (solo admin). Opcional: ?fecha=YYYY-MM-DD */
export async function GET(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const ctx = await defaultContext();
  const fecha = new URL(request.url).searchParams.get("fecha");
  const { meetings } = await listAgenda(ctx, { full: true });
  const names = await companyNames(ctx);
  const rows = meetings
    .filter((m) => !fecha || m.date === fecha)
    .map((m) => [
      m.date,
      m.time,
      m.title,
      m.requesterCompany,
      m.requesterName,
      m.requesterEmail,
      m.guestEmail ?? "",
      names.get(m.targetCompanyId) ?? m.targetCompanyId,
    ]);

  const csv = toCsv(
    ["Fecha", "Hora", "Título", "Empresa del solicitante", "Solicitante", "Correo", "Correo invitado", "Empresa con la que se reúne"],
    rows,
  );
  const name = `reuniones${fecha ? `-${fecha}` : ""}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
    },
  });
}
