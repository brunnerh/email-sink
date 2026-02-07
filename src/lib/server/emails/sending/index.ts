import { env } from '$env/dynamic/private';
import type { SendEmailService } from './send-email-service.ts';
import { EmailLogService } from './log-service.ts';
import { EmailBrevoService } from './brevo-service.ts';
import { EmailSmtpService } from './smtp-service.ts';

export const createSendEmailService = (): SendEmailService => {
	const services = {
		log: EmailLogService,
		brevo: EmailBrevoService,
		smtp: EmailSmtpService,
	} as const;
	const mode = (env.EMAIL_MODE ?? 'log') as keyof typeof services;

	const Service = services[mode];
	if (!Service)
		throw new Error(`Invalid email mode: ${mode}`);

	return new Service();
};
