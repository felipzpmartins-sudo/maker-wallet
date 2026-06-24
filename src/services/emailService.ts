import nodemailer from "nodemailer";
import { env } from "../config/env";

export function isEmailConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM);
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  if (!isEmailConfigured()) {
    console.info(`[password-reset] SMTP nao configurado. Link para ${to}: ${resetUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Redefinicao de senha - Maker Wallet",
    text: [
      `Ola, ${name}.`,
      "",
      "Recebemos uma solicitacao para redefinir sua senha no Maker Wallet.",
      `Acesse este link para criar uma nova senha: ${resetUrl}`,
      "",
      "O link expira em 1 hora. Se voce nao solicitou isso, ignore este e-mail."
    ].join("\n"),
    html: `
      <p>Ola, ${name}.</p>
      <p>Recebemos uma solicitacao para redefinir sua senha no Maker Wallet.</p>
      <p><a href="${resetUrl}">Clique aqui para criar uma nova senha</a>.</p>
      <p>O link expira em 1 hora. Se voce nao solicitou isso, ignore este e-mail.</p>
    `
  });
}
