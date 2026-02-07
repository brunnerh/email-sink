import { Buffer } from 'node:buffer';

export type EmailAttachment = {
	name: string;
	content: Buffer;
};

export type EmailOptions = {
	subject: string;
	contentType: 'text/plain' | 'text/html';
	content: string;
	from: string;
	to: string[];
	cc?: string[];
	bcc?: string[];
	attachments?: EmailAttachment[];
};

export type SendEmailService = {
	sendEmail(options: EmailOptions): Promise<void>;
};
