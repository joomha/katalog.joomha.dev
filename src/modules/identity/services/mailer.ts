import { getIdentityConfig } from "../config";

/**
 * Contract pengiriman email identitas.
 * Driver "console" mencetak ke log server (aman untuk development; token reset
 * tampil di console). Driver "smtp" akan disediakan oleh Agent 09 (modul
 * platform) dengan mengimplementasikan interface ini — sampai tersedia,
 * konfigurasi SMTP akan gagal eksplisit (tidak ada email palsu yang "terkirim").
 */

export interface IdentityMailer {
  sendPasswordResetEmail(params: { to: string; recipientName: string; resetUrl: string }): Promise<void>;
  sendVerificationEmail(params: { to: string; recipientName: string; verificationUrl: string }): Promise<void>;
}

class ConsoleIdentityMailer implements IdentityMailer {
  async sendPasswordResetEmail({ to, recipientName, resetUrl }: { to: string; recipientName: string; resetUrl: string }): Promise<void> {
    console.info(
      `[identity-mailer:console] Tautan reset kata sandi untuk ${recipientName} <${to}>: ${resetUrl}`
    );
  }

  async sendVerificationEmail({ to, recipientName, verificationUrl }: { to: string; recipientName: string; verificationUrl: string }): Promise<void> {
    console.info(
      `[identity-mailer:console] Tautan verifikasi email untuk ${recipientName} <${to}>: ${verificationUrl}`
    );
  }
}

class UnimplementedSmtpMailer implements IdentityMailer {
  async sendPasswordResetEmail(): Promise<void> {
    throw new Error(
      "Driver SMTP belum tersedia. Agent 09 (platform/notifikasi) akan mengimplementasikan IdentityMailer SMTP. Gunakan MAIL_DRIVER=console untuk development."
    );
  }

  async sendVerificationEmail(): Promise<void> {
    throw new Error(
      "Driver SMTP belum tersedia. Agent 09 (platform/notifikasi) akan mengimplementasikan IdentityMailer SMTP. Gunakan MAIL_DRIVER=console untuk development."
    );
  }
}

export function getIdentityMailer(): IdentityMailer {
  const config = getIdentityConfig();
  return config.MAIL_DRIVER === "smtp"
    ? new UnimplementedSmtpMailer()
    : new ConsoleIdentityMailer();
}
