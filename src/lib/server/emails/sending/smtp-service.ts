import { env } from '$env/dynamic/private';
import nodemailer from 'nodemailer';
import type { EmailOptions, SendEmailService } from './send-email-service.ts';

export class EmailSmtpService implements SendEmailService {
	private transporter: nodemailer.Transporter;

	constructor() {
		const host = env.SMTP_HOST;
		if (!host)
			throw new Error('SMTP_HOST is not set');

		const port = env.SMTP_PORT ? Number(env.SMTP_PORT) : 587;
		if (!Number.isFinite(port) || port <= 0)
			throw new Error('SMTP_PORT must be a positive number');

		const secure = env.SMTP_SECURE === 'true';
		const user = env.SMTP_USER;
		const pass = env.SMTP_PASS;

		if ((user && !pass) || (!user && pass))
			throw new Error('SMTP_USER and SMTP_PASS must be set together');

		this.transporter = nodemailer.createTransport({
			host,
			port,
			secure,
			auth: user ? { user, pass: pass! } : undefined,
		});
	}

	async sendEmail(options: EmailOptions): Promise<void> {
		await this.transporter.sendMail({
			from: options.from,
			to: options.to,
			cc: options.cc,
			bcc: options.bcc,
			subject: options.subject,
			text: options.contentType === 'text/plain'
				? options.content
				: undefined,
			html: options.contentType === 'text/html'
				? options.content
				: undefined,
			attachments: options.attachments?.map((attachment) => ({
				filename: attachment.name,
				content: attachment.content,
			})),
		});
	}
}
