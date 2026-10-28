"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import ComponentCard from "@/components/common/ComponentCard";
import KpiCard from "@/components/common/KpiCard";
import { BoxIcon, CalendarIcon, DownloadIcon, GroupIcon, TableIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { toCsv } from "@/lib/csv";
import { COMPANIES, DAYS, SLOT_TIMES, companyById, type Meeting } from "./data";
import { endTime, formatDayLabel, formatDayShort } from "./logic";
import { useAgenda } from "./store";

const headCell = "px-4 py-3 text-start text-theme-xs font-medium whitespace-nowrap text-gray-500 dark:text-gray-400";
const bodyCell = "px-4 py-3.5 text-start text-theme-sm text-gray-500 dark:text-gray-400";

/** Resumen del día, igual que el panel de administración real: métricas, pestañas por día y listado. */
export function SummaryPanel() {
  const { meetings, blocks, cancelMeeting } = useAgenda();
  const [day, setDay] = useState<string>(DAYS[0]);
  const [toCancel, setToCancel] = useState<Meeting | null>(null);

  const dayMeetings = meetings
    .filter((m) => m.date === day)
    .sort((a, b) => a.time.localeCompare(b.time));
  const dayBlocks = blocks.filter((b) => b.date === day);

  const companiesWithMeetings = new Set(dayMeetings.map((m) => m.targetCompanyId)).size;
  const occupancy = Math.round((dayMeetings.length / SLOT_TIMES.length) * 100);
  const freeSlots = SLOT_TIMES.filter(
    (t) => !dayMeetings.some((m) => m.time === t) && !dayBlocks.some((b) => b.time === t),
  ).length;

  function downloadCsv() {
    const csv = toCsv(
      ["Fecha", "Inicio", "Fin", "Título", "Empresa solicitante", "Empresa destino", "Solicitante", "Correo", "Correo invitado"],
      dayMeetings.map((m) => [
        m.date,
        m.time,
        endTime(m.time),
        m.title,
        m.requesterCompany,
        companyById(m.targetCompanyId)?.name ?? "",
        m.requesterName,
        m.requesterEmail,
        m.guestEmail ?? "",
      ]),
    );
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `reuniones-${day}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={d === day}
              onClick={() => setDay(d)}
              className={cn(
                "min-h-11 rounded-lg px-4 text-sm font-medium capitalize transition",
                d === day
                  ? "bg-brand-500 text-white shadow-theme-xs"
                  : "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/3",
              )}
            >
              {formatDayShort(d)}
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={downloadCsv} startIcon={<DownloadIcon className="size-4" />}>
          Descargar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <KpiCard icon={<CalendarIcon className="size-6" />} label="Reuniones del día" value={String(dayMeetings.length)} hint={`de ${SLOT_TIMES.length} bloques`} />
        <KpiCard icon={<GroupIcon className="size-6" />} label="Empresas con reunión" value={`${companiesWithMeetings} de ${COMPANIES.length}`} />
        <KpiCard icon={<TableIcon className="size-6" />} label="Ocupación de la sala" value={`${occupancy}%`} tone={occupancy >= 80 ? "warning" : "brand"} />
        <KpiCard icon={<BoxIcon className="size-6" />} label="Bloques libres" value={String(freeSlots)} hint={`${dayBlocks.length} bloqueados`} tone="success" />
      </div>

      <ComponentCard title="Reuniones del día" desc={formatDayLabel(day)}>
        {dayMeetings.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">Todavía no hay reuniones para este día.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/5">
                  <TableRow>
                    {["Hora", "Título", "Empresas", "Solicitante", "Correo", ""].map((h) => (
                      <TableCell key={h} isHeader className={headCell}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                  {dayMeetings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className={cn(bodyCell, "font-medium whitespace-nowrap text-gray-800 dark:text-white/90")}>
                        {m.time} – {endTime(m.time)}
                      </TableCell>
                      <TableCell className={cn(bodyCell, "font-medium text-gray-800 dark:text-white/90")}>{m.title}</TableCell>
                      <TableCell className={bodyCell}>
                        {m.requesterCompany} → {companyById(m.targetCompanyId)?.name}
                      </TableCell>
                      <TableCell className={bodyCell}>{m.requesterName}</TableCell>
                      <TableCell className={bodyCell}>
                        {m.requesterEmail}
                        {m.guestEmail && <span className="block">{m.guestEmail}</span>}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-end">
                        <Button size="sm" variant="outline" className="text-error-600 dark:text-error-500" onClick={() => setToCancel(m)}>
                          Cancelar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="flex flex-col divide-y divide-gray-100 md:hidden dark:divide-white/5">
              {dayMeetings.map((m) => (
                <li key={m.id} className="flex flex-col gap-3 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-base font-semibold text-gray-800 dark:text-white/90">
                      {m.time} – {endTime(m.time)}
                    </span>
                    <Badge size="sm" color="primary">{companyById(m.targetCompanyId)?.name}</Badge>
                  </div>
                  <p className="font-medium text-gray-800 dark:text-white/90">{m.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {m.requesterName} · {m.requesterCompany}
                  </p>
                  <p className="text-sm break-all text-gray-500 dark:text-gray-400">
                    {m.requesterEmail}
                    {m.guestEmail && ` · ${m.guestEmail}`}
                  </p>
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" className="text-error-600 dark:text-error-500" onClick={() => setToCancel(m)}>
                      Cancelar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </ComponentCard>

      <Modal isOpen={toCancel !== null} onClose={() => setToCancel(null)} className="max-w-md p-6 sm:p-8">
        {toCancel && (
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">¿Cancelar esta reunión?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {toCancel.title} · {toCancel.time} · {companyById(toCancel.targetCompanyId)?.name}. El horario quedará libre.
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setToCancel(null)}>Volver</Button>
              <Button
                variant="danger"
                onClick={() => {
                  cancelMeeting(toCancel.id);
                  setToCancel(null);
                }}
              >
                Sí, cancelar reunión
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
