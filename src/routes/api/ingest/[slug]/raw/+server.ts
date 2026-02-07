import { db } from '$lib/server/db/index';
import {
	attachmentBlob,
	email,
	emailAttachment,
	emailRecipient,
} from '$lib/server/db/schema';
import { requireNone } from '$lib/server/auth/guards';
import { stripAttachmentBodies } from '$lib/server/emails/raw-ingest';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { simpleParser } from 'mailparser';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { authenticateSink } from '../authenticate.ts';

export const POST: RequestHandler = async ({ request }) => {
	requireNone();
	const authResult = await authenticateSink();
	if (authResult.status === 'error')
		return authResult.response;

	const raw = await request.text();
	if (!raw)
		return json({ error: 'Email payload is required.' }, { status: 400 });

	const parsed = await simpleParser(raw);
	const from = parsed.from?.value?.[0];
	const toArray = (value?: typeof parsed.to) => {
		const list = Array.isArray(value) ? value : value ? [value] : [];

		return list.flatMap((x) => x.value);
	};
	const to = toArray(parsed.to);
	const cc = toArray(parsed.cc);
	const bcc = toArray(parsed.bcc);
	const attachments = parsed.attachments ?? [];
	const textContent = parsed.text ?? null;
	const htmlContent = parsed.html === false ? null : (parsed.html ?? null);

	const headers = Object.fromEntries(parsed.headers.entries());
	const rawContent = stripAttachmentBodies(raw);

	const result = await db.transaction(async (tx) => {
		const [createdEmail] = await tx.insert(email).values({
			sinkId: authResult.data.id,
			subject: parsed.subject ?? null,
			messageId: parsed.messageId ?? null,
			fromAddress: emptyToNull(from?.address ?? ''),
			fromName: emptyToNull(from?.name ?? ''),
			headers,
			textContent,
			htmlContent,
			rawContent,
		}).returning();

		const recipientRows = [
			...to.map((entry) => ({ type: 'to' as const, entry })),
			...cc.map((entry) => ({ type: 'cc' as const, entry })),
			...bcc.map((entry) => ({ type: 'bcc' as const, entry })),
		];

		if (recipientRows.length > 0) {
			await tx.insert(emailRecipient).values(
				recipientRows.map(({ type, entry }) => ({
					emailId: createdEmail.id,
					type,
					address: emptyToNull(entry.address ?? ''),
					name: emptyToNull(entry.name ?? ''),
					raw: entry.address && entry.name
						? `${entry.name} <${entry.address}>`
						: entry.address,
				})),
			);
		}

		for (const attachment of attachments) {
			const content = attachment.content;
			const sha256 = hashBuffer(content);
			const size = attachment.size ?? content.length;

			const [existingBlob] = await tx
				.select()
				.from(attachmentBlob)
				.where(eq(attachmentBlob.sha256, sha256))
				.limit(1);

			const blobId = existingBlob
				? existingBlob.id
				: (await tx.insert(attachmentBlob).values({
					sha256,
					size,
					content,
				}).returning())[0].id;

			await tx.insert(emailAttachment).values({
				emailId: createdEmail.id,
				blobId,
				filename: attachment.filename ?? null,
				contentType: attachment.contentType ?? null,
				contentId: attachment.cid ?? null,
				disposition: attachment.contentDisposition ?? null,
				size,
			});
		}

		return createdEmail;
	});

	return json({ emailId: result.id }, { status: 201 });
};

function hashBuffer(buffer: Buffer) {
	return createHash('sha256').update(buffer).digest('hex');
}

function emptyToNull(x: string) {
	return x.trim() === '' ? null : x;
}
