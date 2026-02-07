import { db } from '$lib/server/db/index';
import {
	attachmentBlob,
	email,
	emailAttachment,
	emailRecipient,
} from '$lib/server/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';

export const listEmailsForSink = async (
	sinkId: number,
	options: { limit?: number } = {},
) => {
	const query = db.select().from(email).where(eq(email.sinkId, sinkId))
		.orderBy(desc(email.receivedAt));

	return options.limit ? await query.limit(options.limit) : await query;
};

export const listRecipientsForEmails = async (emailIds: number[]) =>
	emailIds.length === 0 ? [] : await db.select().from(emailRecipient).where(
		inArray(emailRecipient.emailId, emailIds),
	);

export const listAttachmentsForEmails = async (emailIds: number[]) =>
	emailIds.length === 0 ? [] : await db.select().from(emailAttachment).where(
		inArray(emailAttachment.emailId, emailIds),
	);

export const getEmailDetail = async (sinkId: number, emailId: number) => {
	const [row] = await db.select().from(email).where(eq(email.id, emailId))
		.limit(1);
	if (!row || row.sinkId !== sinkId)
		return null;

	return row;
};

export const getRecipientsForEmail = async (emailId: number) =>
	await db.select().from(emailRecipient).where(
		eq(emailRecipient.emailId, emailId),
	);

export const getAttachmentsForEmail = async (emailId: number) =>
	await db.select().from(emailAttachment).where(
		eq(emailAttachment.emailId, emailId),
	);

export const getAttachmentBlob = async (attachmentId: number) => {
	const [row] = await db
		.select({
			attachment: emailAttachment,
			blob: attachmentBlob,
		})
		.from(emailAttachment)
		.innerJoin(
			attachmentBlob,
			eq(emailAttachment.blobId, attachmentBlob.id),
		)
		.where(eq(emailAttachment.id, attachmentId))
		.limit(1);

	return row ?? null;
};
