import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { sink, sinkApiKey } from '$lib/server/db/schema';
import { hashApiKey } from '$lib/server/sinks/keys';
import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

export async function authenticateSink() {
	const { params, request } = getRequestEvent();

	const slug = String(params.slug ?? '').trim();
	if (!slug) {
		return error(
			json({ error: 'Sink slug is required.' }, { status: 400 }),
		);
	}

	const [sinkRow] = await db.select()
		.from(sink)
		.where(eq(sink.slug, slug))
		.limit(1);
	if (!sinkRow)
		return error(json({ error: 'Sink not found.' }, { status: 404 }));

	if (sinkRow.isAuthEnabled == false)
		return ok(sinkRow);

	const authorization = request.headers.get('authorization') ?? '';
	const match = authorization.match(/^bearer\s+(.+)$/i);
	const token = match?.[1];
	if (!token)
		return error(json({ error: 'Missing bearer token.' }, { status: 401 }));

	const tokenHash = hashApiKey(token);
	const [keyRow] = await db.select().from(sinkApiKey).where(and(
		eq(sinkApiKey.sinkId, sinkRow.id),
		eq(sinkApiKey.keyHash, tokenHash),
	)).limit(1);

	if (!keyRow)
		return error(json({ error: 'Invalid API key.' }, { status: 403 }));

	await db.update(sinkApiKey).set({ lastUsedAt: new Date() }).where(
		eq(sinkApiKey.id, keyRow.id),
	);

	return ok(sinkRow);
}

function ok<T>(data: T) {
	return { status: 'ok' as const, data };
}

function error(response: Response) {
	return { status: 'error' as const, response };
}
