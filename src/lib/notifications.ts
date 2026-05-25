import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}

export async function notify(input: NotifyInput) {
  return prisma.notification.create({ data: input });
}

export async function notifyMany(inputs: NotifyInput[]) {
  if (!inputs.length) return;
  await prisma.notification.createMany({ data: inputs });
}

/**
 * Lightweight email sender. If EMAIL_SERVER is not configured,
 * emails are logged to the console (useful for dev / demo).
 * Replace with nodemailer / Resend / SES in production.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  body: string;
}) {
  if (!process.env.EMAIL_SERVER) {
    console.log(`[email] to=${opts.to} subject=${opts.subject}\n${opts.body}`);
    return { ok: true, simulated: true };
  }
  // Real provider integration goes here.
  console.log(`[email][prod] to=${opts.to} subject=${opts.subject}`);
  return { ok: true };
}
