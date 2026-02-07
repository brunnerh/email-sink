import type { EmailOptions, SendEmailService } from './send-email-service.ts';

export class EmailLogService implements SendEmailService {
	sendEmail(options: EmailOptions) {
		console.log('EmailLogService.sendEmail', {
			...options,
			attachments: options.attachments?.map((attachment) =>
				attachment.name
			),
		});

		return Promise.resolve();
	}
}
