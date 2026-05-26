export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });

  // On répond toujours "ok" pour ne pas révéler si l'email existe
  if (!user) return NextResponse.json({ ok: true });

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1h

  await prisma.user.update({
    where: { email },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || process.env.BREVO_SMTP_USER,
      pass: process.env.SMTP_PASS || process.env.BREVO_SMTP_PASS,
    },
  });

  const from = process.env.BREVO_FROM_NAME
    ? `"${process.env.BREVO_FROM_NAME}" <${process.env.BREVO_FROM_EMAIL}>`
    : process.env.BREVO_FROM_EMAIL;

  await transporter.sendMail({
    from,
    to: email,
    subject: "Réinitialisation de votre mot de passe — Trouma-Pro",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#1e3a6e;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">Trouma-Pro</h1>
          <p style="color:#a8c4e8;margin:4px 0 0;font-size:14px">Réinitialisation du mot de passe</p>
        </div>
        <div style="padding:32px;background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <p style="font-size:15px">Bonjour,</p>
          <p style="font-size:14px;line-height:1.6;color:#555">
            Vous avez demandé à réinitialiser votre mot de passe.<br>
            Cliquez sur le bouton ci-dessous — ce lien est valable <strong>1 heure</strong>.
          </p>
          <div style="text-align:center;margin:28px 0">
            <a href="${resetUrl}"
              style="background:#2563eb;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">
              Réinitialiser mon mot de passe
            </a>
          </div>
          <p style="font-size:12px;color:#999">
            Si vous n'avez pas fait cette demande, ignorez simplement cet email.<br>
            Lien : ${resetUrl}
          </p>
        </div>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
