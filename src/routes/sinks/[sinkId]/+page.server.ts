import { resolve as resolvePath } from '$app/paths';
import { parseNumericId } from '$lib/server/api/params';
import { requireNone } from '$lib/server/auth/guards';
import { db } from '$lib/server/db/index';
import { email } from '$lib/server/db/schema';
import {
	listAttachmentsForEmails,
	listEmailsForSink,
	listRecipientsForEmails,
} from '$lib/server/emails/queries';
import { loadSinkForUser } from '$lib/server/sinks/queries';
import { fail, redirect } from '@sveltejs/kit';
import { and, eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

const EmailLimit = 200;

export const load = (async ({ params }) => {
	requireNone();
	const sinkId = parseNumericId(params.sinkId, 'sinkId');
	const sinkRow = await loadSinkForUser(sinkId);

	const emails = await listEmailsForSink(sinkId, { limit: EmailLimit });
	const emailIds = emails.map((row) => row.id);
	const recipients = await listRecipientsForEmails(emailIds);
	const attachments = await listAttachmentsForEmails(emailIds);
	const [countRow] = await db.select({
		count: sql<number>`count(*)`,
	}).from(email).where(eq(email.sinkId, sinkId)).limit(1);
	const emailTotal = Number(countRow?.count ?? 0);

	return {
		sink: sinkRow,
		emails,
		emailTotal,
		emailLimit: EmailLimit,
		recipients,
		attachments,
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	async clearEmails({ params }) {
		requireNone();
		const sinkId = parseNumericId(params.sinkId, 'sinkId');
		await loadSinkForUser(sinkId);
		await db.delete(email).where(eq(email.sinkId, sinkId));
	},
	async deleteEmail({ params, request }) {
		requireNone();
		const sinkId = parseNumericId(params.sinkId, 'sinkId');
		const formData = await request.formData();
		const emailId = parseNumericId(
			String(formData.get('emailId') ?? ''),
			'emailId',
		);

		await loadSinkForUser(sinkId);
		const [deleted] = await db.delete(email)
			.where(and(eq(email.id, emailId), eq(email.sinkId, sinkId)))
			.returning();
		if (!deleted)
			return fail(404, { error: 'Email not found.' });
	},
};
