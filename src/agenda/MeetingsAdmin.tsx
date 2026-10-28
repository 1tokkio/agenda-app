"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import ComponentCard from "@/components/common/ComponentCard";
import { MeetingForm } from "./MeetingForm";
import { companyById, type Meeting } from "./data";
import { formatDayShort } from "./logic";
import { useAgenda } from "./store";

/** Listado de todas las reuniones, con edición y cancelación. Responsivo: tabla en escritorio, tarjetas en celular. */
export function MeetingsAdmin() {
  const { meetings, cancelMeeting, updateMeeting } = useAgenda();
  const [editing, setEditing] = useState<Meeting | null>(null);
  const sorted = [...meetings].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <>
      <ComponentCard title="Reuniones agendadas" desc={`${meetings.length} reuniones confirmadas`}>
        {sorted.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400">No hay reuniones agendadas.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/5">
                  <TableRow>
                    {["Día y hora", "Título", "Empresas", "Solicitante", "Correos", ""].map((h) => (
                      <TableCell key={h} isHeader className="px-4 py-3 text-start text-theme-xs font-medium whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
                  {sorted.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="px-4 py-3.5 text-sm whitespace-nowrap text-gray-800 dark:text-white/90">
                        <span className="capitalize">{formatDayShort(m.date)}</span> · {m.time}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm font-medium text-gray-800 dark:text-white/90">{m.title}</TableCell>
                      <TableCell className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                        {m.requesterCompany} → {companyById(m.targetCompanyId)?.name}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">{m.requesterName}</TableCell>
                      <TableCell className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                        {m.requesterEmail}
                        {m.guestEmail && <span className="block">{m.guestEmail}</span>}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-end whitespace-nowrap">
                        <Button size="sm" variant="outline" onClick={() => setEditing(m)}>Editar</Button>{" "}
                        <Button size="sm" variant="danger" onClick={() => cancelMeeting(m.id)}>Cancelar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="flex flex-col divide-y divide-gray-100 md:hidden dark:divide-white/5">
              {sorted.map((m) => (
                <li key={m.id} className="flex flex-col gap-2 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-base font-semibold text-gray-800 dark:text-white/90">
                      <span className="capitalize">{formatDayShort(m.date)}</span> · {m.time}
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
                  <div className="mt-1 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(m)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => cancelMeeting(m.id)}>Cancelar</Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </ComponentCard>

      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} className="max-w-xl p-6 sm:p-8">
        {editing && (
          <MeetingForm
            date={editing.date}
            time={editing.time}
            initial={editing}
            submitLabel="Guardar cambios"
            onSubmit={(input) => updateMeeting(editing.id, input)}
            onDone={() => setEditing(null)}
            onCancelMeeting={() => {
              cancelMeeting(editing.id);
              setEditing(null);
            }}
            onClose={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  );
}
