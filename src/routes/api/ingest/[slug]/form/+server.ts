import { dev } from '$app/environment';
import { requireNone } from '$lib/server/auth/guards';
import { db } from '$lib/server/db/index';
import {
	attachmentBlob,
	email,
	emailAttachment,
	emailRecipient,
} from '$lib/server/db/schema';
import {
	decodeFormData,
	normalizeFiles,
	normalizeHeaders,
	normalizeMailboxList,
	parseMailbox,
} from '$lib/server/emails/form-ingest';
import { requiredString } from '$lib/server/validation';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { authenticateSink } from '../authenticate.ts';

const hashBuffer = (buffer: Buffer) =>
	createHash('sha256').update(buffer).digest('hex');

export const POST: RequestHandler = async ({ request }) => {
	requireNone();
	const authResult = await authenticateSink();
	if (authResult.status === 'error')
		return authResult.response;

	const formData = await request.formData();
	const payload = decodeFormData(formData);

	const schema = z.object({
		from: requiredString,
		to: z.union([z.string(), z.array(z.string())]).optional(),
		cc: z.union([z.string(), z.array(z.string())]).optional(),
		bcc: z.union([z.string(), z.array(z.string())]).optional(),
		subject: z.string().optional(),
		text: z.string().optional(),
		html: z.string().optional(),
		messageId: z.string().optional(),
		receivedAt: z.string().optional(),
		headers: z.record(z.string(), z.unknown()).optional(),
		attachments: z.unknown().optional(),
	});
	const parsed = schema.safeParse(payload);
	if (!parsed.success) {
		return json({
			error: parsed.error.issues[0]?.message ?? 'Invalid form data.',
		}, { status: 400 });
	}

	const from = parseMailbox(parsed.data.from);
	if (!from)
		return json({ error: 'From is required.' }, { status: 400 });

	const to = normalizeMailboxList(parsed.data.to);
	if (!to.length) {
		return json({ error: 'At least one recipient is required.' }, {
			status: 400,
		});
	}

	const cc = normalizeMailboxList(parsed.data.cc);
	const bcc = normalizeMailboxList(parsed.data.bcc);
	const textContent = parsed.data.text ?? null;
	const htmlContent = parsed.data.html ?? null;

	if (!textContent && !htmlContent) {
		return json({ error: 'Text or HTML content is required.' }, {
			status: 400,
		});
	}

	const headers = normalizeHeaders(parsed.data.headers ?? null);
	const subject = parsed.data.subject ?? null;
	const messageId = parsed.data.messageId ?? null;
	const receivedAt = parsed.data.receivedAt
		? new Date(parsed.data.receivedAt)
		: new Date();

	if (Number.isNaN(receivedAt.getTime()))
		return json({ error: 'Invalid receivedAt value.' }, { status: 400 });

	const attachments = normalizeFiles(
		(parsed.data.attachments as File | File[] | null) ?? null,
		formData.getAll('attachments'),
	);

	const result = await db.transaction(async (tx) => {
		const [createdEmail] = await tx.insert(email).values({
			sinkId: authResult.data.id,
			subject,
			messageId,
			fromAddress: from.address,
			fromName: from.name,
			headers: headers ?? null,
			textContent,
			htmlContent,
			rawContent: textContent ?? htmlContent,
			receivedAt,
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
					address: entry.address,
					name: entry.name ?? null,
					raw: entry.raw,
				})),
			);
		}

		for (const attachment of attachments) {
			const buffer = Buffer.from(await attachment.arrayBuffer());
			const sha256 = hashBuffer(buffer);
			const size = attachment.size ?? buffer.length;

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
					content: buffer,
				}).returning())[0].id;

			await tx.insert(emailAttachment).values({
				emailId: createdEmail.id,
				blobId,
				filename: attachment.name ?? null,
				contentType: attachment.type || null,
				contentId: null,
				disposition: 'attachment',
				size,
			});
		}

		return createdEmail;
	});

	return json({ emailId: result.id }, { status: 201 });
};
