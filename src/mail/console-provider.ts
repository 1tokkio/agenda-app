import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MailMessage, MailProvider } from "./provider";

/**
 * Desarrollo local: muestra el correo en consola y lo guarda en la carpeta
 * de salida (por defecto /tmp/outbox; en Windows equivale a C:\tmp\outbox).
 */
export class ConsoleMailProvider implements MailProvider {
  readonly name = "console";

  constructor(
    private readonly outboxDir = process.env.OUTBOX_DIR ?? "/tmp/outbox",
  ) {}

  async send(message: MailMessage): Promise<void> {
    await mkdir(this.outboxDir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const random = Math.random().toString(36).slice(2, 8);
    const base = path.join(
      this.outboxDir,
      `${stamp}-${random}-${message.to.replace(/[^a-z0-9]/gi, "_")}`,
    );

    await writeFile(`${base}.html`, message.html, "utf8");
    await writeFile(`${base}.txt`, message.text, "utf8");

    console.log(
      `[mail] para ${message.to} | ${message.subject}\n[mail] guardado en ${base}.html`,
    );
  }
}
