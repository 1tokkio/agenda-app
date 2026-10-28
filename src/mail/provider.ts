export type MailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/** Cualquier proveedor de correo (consola, Resend, Postmark...) implementa esto. */
export interface MailProvider {
  readonly name: string;
  send(message: MailMessage): Promise<void>;
}
