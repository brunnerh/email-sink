import { parseNumericId } from '$lib/server/api/params';
import { requireNone } from '$lib/server/auth/guards';
import { getAttachmentBlob, getEmailDetail } from '$lib/server/emails/queries';
import { loadSinkForUser } from '$lib/server/sinks/queries';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, request }) => {
	requireNone();
	const sinkId = parseNumericId(params.sinkId, 'sinkId');
	const emailId = parseNumericId(params.emailId, 'emailId');
	const attachmentId = parseNumericId(params.attachmentId, 'attachmentId');

	await loadSinkForUser(sinkId);
	const email = await getEmailDetail(sinkId, emailId);
	if (!email)
		return error('Email not found', 404);

	const record = await getAttachmentBlob(attachmentId);
	if (!record || record.attachment.emailId !== emailId)
		return error('Attachment not found', 404);

	const filename = record.attachment.filename ?? 'attachment.bin';
	const contentType = record.attachment.contentType ??
		'application/octet-stream';

	return new Response(new Uint8Array(record.blob.content), {
		headers: {
			'Content-Type': contentType,
			'Content-Disposition': `attachment; ${encodeFilename(filename)}`,
		},
	});
};

function encodeFilename(filename: string): string {
	return `filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function error(message: string, status: number = 400) {
	return new Response(message, { status });
}
