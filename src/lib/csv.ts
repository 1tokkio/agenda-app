/**
 * CSV para Excel: separador ";" (configuración habitual en español) y BOM UTF-8
 * para que las tildes se vean bien al abrirlo.
 */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (value: string | number) => {
    const text = String(value ?? "");
    return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [headers, ...rows].map((row) => row.map(escape).join(";"));
  return "﻿" + lines.join("\r\n") + "\r\n";
}
