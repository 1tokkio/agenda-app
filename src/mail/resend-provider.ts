import type { MailMessage, MailProvider } from "./provider";

/**
 * Preparado pero NO activado. Se usa solo con MAIL_PROVIDER=resend.
 * Falta probarlo con una cuenta real y un dominio verificado en Resend.
 */
export class ResendMailProvider implements MailProvider {
  readonly name = "resend";

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: MailMessage): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Resend respondió ${response.status}: ${await response.text()}`,
      );
    }
  }
}
