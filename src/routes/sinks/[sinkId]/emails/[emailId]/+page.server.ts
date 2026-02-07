import { parseNumericId } from '$lib/server/api/params';
import { requireNone } from '$lib/server/auth/guards';
import {
	getAttachmentsForEmail,
	getEmailDetail,
	getRecipientsForEmail,
} from '$lib/server/emails/queries';
import { loadSinkForUser } from '$lib/server/sinks/queries';
import type { ServerLoad } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const load: ServerLoad = async ({ params }) => {
	requireNone();
	const sinkId = parseNumericId(params.sinkId, 'sinkId');
	const emailId = parseNumericId(params.emailId, 'emailId');

	await loadSinkForUser(sinkId);
	const email = await getEmailDetail(sinkId, emailId);
	if (!email)
		throw error(404, 'Email not found');

	const recipients = await getRecipientsForEmail(emailId);
	const attachments = await getAttachmentsForEmail(emailId);

	return { email, recipients, attachments };
};
