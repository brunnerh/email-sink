import {
	SendSmtpEmail,
	TransactionalEmailsApi,
	TransactionalEmailsApiApiKeys,
} from '@getbrevo/brevo';
import { env } from '$env/dynamic/private';
import type { EmailOptions, SendEmailService } from './send-email-service.ts';

export class EmailBrevoService implements SendEmailService {
	private apiInstance: TransactionalEmailsApi;

	constructor() {
		if (!env.BREVO_API_KEY)
			throw new Error('BREVO_API_KEY is not set');

		this.apiInstance = new TransactionalEmailsApi();
		this.apiInstance.setApiKey(
			TransactionalEmailsApiApiKeys.apiKey,
			env.BREVO_API_KEY,
		);
	}

	async sendEmail(options: EmailOptions): Promise<void> {
		const smtpEmail = new SendSmtpEmail();
		smtpEmail.subject = options.subject;
		smtpEmail.textContent = options.contentType === 'text/plain'
			? options.content
			: undefined;
		smtpEmail.htmlContent = options.contentType === 'text/html'
			? options.content
			: undefined;
		smtpEmail.sender = formatEmail(options.from);
		smtpEmail.to = formatEmailList(options.to);
		smtpEmail.cc = formatEmailList(options.cc);
		smtpEmail.bcc = formatEmailList(options.bcc);
		smtpEmail.attachment = options.attachments?.map((attachment) => ({
			name: attachment.name,
			content: attachment.content.toString('base64'),
		}));

		await this.apiInstance.sendTransacEmail(smtpEmail);
	}
}

function formatEmail(mailbox?: string) {
	if (!mailbox)
		return undefined;

	return new BrevoEmailUser(mailbox);
}

function formatEmailList(mailboxes?: string[]) {
	if (!mailboxes)
		return undefined;

	return mailboxes.map((mailbox) => new BrevoEmailUser(mailbox));
}

class BrevoEmailUser {
	email: string;
	name?: string;

	constructor(mailbox: string) {
		if (mailbox.includes('<')) {
			const [name, email] = mailbox
				.split(/[<>]/)
				.map((entry) => entry.trim())
				.filter((entry) => entry !== '');
			this.email = email;
			this.name = name;
		}
		else {
			this.email = mailbox;
		}
	}
}
