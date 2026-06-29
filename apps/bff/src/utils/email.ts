import nodemailer from 'nodemailer';
import { prisma } from '../db/prisma.js';

let transporter: nodemailer.Transporter | null = null;

export async function getSmtpConfig() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: ['smtp.host', 'smtp.port', 'smtp.user', 'smtp.pass', 'smtp.from', 'smtp.secure'] } },
  });
  const config: Record<string, string> = {};
  for (const s of settings) {
    config[s.key] = s.value;
  }
  return config;
}

export async function initTransporter() {
  const config = await getSmtpConfig();
  if (!config['smtp.host'] || !config['smtp.user'] || !config['smtp.pass']) {
    transporter = null;
    return false;
  }
  transporter = nodemailer.createTransport({
    host: config['smtp.host'],
    port: parseInt(config['smtp.port'] || '587'),
    secure: config['smtp.secure'] === 'true',
    auth: { user: config['smtp.user'], pass: config['smtp.pass'] },
  });
  return true;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  if (!transporter) {
    const ok = await initTransporter();
    if (!ok) return { success: false, error: 'SMTP 未配置' };
  }
  try {
    const config = await getSmtpConfig();
    const from = config['smtp.from'] || config['smtp.user'];
    await transporter!.sendMail({ from, to, subject, html });
    await prisma.emailLog.create({ data: { to, subject, content: html, status: 'SUCCESS' } });
    return { success: true };
  } catch (err: any) {
    await prisma.emailLog.create({ data: { to, subject, content: html, status: 'FAILED', errorMsg: err.message } });
    return { success: false, error: err.message };
  }
}
