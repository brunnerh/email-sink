import { resolve } from '$app/paths';
import { getRequestEvent } from '$app/server';
import { parseNumericId } from '$lib/server/api/params';
import { requireAdmin } from '$lib/server/auth/guards';
import { db } from '$lib/server/db/index';
import { sink, sinkApiKey, sinkAuthRule } from '$lib/server/db/schema';
import { loadSinkForUser } from '$lib/server/sinks/queries';
import { generateApiKey, hashApiKey } from '$lib/server/sinks/keys';
import { requiredString } from '$lib/server/validation';
import type { Actions, ServerLoad } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const ruleTypes = new Set(['equals', 'contains', 'starts_with', 'ends_with']);

export const load: ServerLoad = async () => {
	requireAdmin();
	const sinkRow = await loadSink();

	const apiKeys = await db.select().from(sinkApiKey).where(
		eq(sinkApiKey.sinkId, sinkRow.id),
	);
	const authRules = await db.select().from(sinkAuthRule).where(
		eq(sinkAuthRule.sinkId, sinkRow.id),
	);

	return { sink: sinkRow, apiKeys, authRules };
};

export const actions: Actions = {
	createApiKey: async ({ request }) => {
		requireAdmin();
		const sinkRow = await loadSink();
		const formData = await request.formData();
		const schema = z.object({
			name: requiredString,
		});
		const parsed = schema.safeParse({
			name: formData.get('name') ?? 'API key',
		});
		if (!parsed.success) {
			return fail(400, {
				error: parsed.error.issues[0]?.message ?? 'Invalid form data.',
			});
		}

		const apiKey = generateApiKey();
		const keyHash = hashApiKey(apiKey);

		const [created] = await db.insert(sinkApiKey).values({
			sinkId: sinkRow.id,
			name: parsed.data.name,
			keyHash,
		}).returning();

		return { apiKey, keyId: created.id };
	},

	deleteApiKey: async ({ request }) => {
		requireAdmin();
		const sinkRow = await loadSink();
		const formData = await request.formData();
		const keyId = parseNumericId(
			String(formData.get('keyId') ?? ''),
			'keyId',
		);

		const [deleted] = await db.delete(sinkApiKey).where(and(
			eq(sinkApiKey.id, keyId),
			eq(sinkApiKey.sinkId, sinkRow.id),
		)).returning();

		if (!deleted)
			return fail(404, { error: 'API key not found.' });

		return { keyId: deleted.id };
	},

	createAuthRule: async ({ request }) => {
		requireAdmin();
		const sinkRow = await loadSink();
		const formData = await request.formData();
		const schema = z.object({
			type: requiredString,
			value: requiredString,
		});
		const parsed = schema.safeParse({
			type: formData.get('type'),
			value: formData.get('value'),
		});
		if (!parsed.success) {
			return fail(400, {
				error: parsed.error.issues[0]?.message ?? 'Invalid form data.',
			});
		}
		if (!ruleTypes.has(parsed.data.type))
			return fail(400, { error: 'Invalid rule type.' });

		const [created] = await db.insert(sinkAuthRule).values({
			sinkId: sinkRow.id,
			type: parsed.data.type as typeof sinkAuthRule.$inferInsert.type,
			value: parsed.data.value,
		}).returning();

		return { rule: created };
	},

	deleteAuthRule: async ({ request }) => {
		requireAdmin();
		const sinkRow = await loadSink();
		const formData = await request.formData();
		const ruleId = parseNumericId(
			String(formData.get('ruleId') ?? ''),
			'ruleId',
		);

		const [deleted] = await db.delete(sinkAuthRule).where(and(
			eq(sinkAuthRule.id, ruleId),
			eq(sinkAuthRule.sinkId, sinkRow.id),
		)).returning();

		if (!deleted)
			return fail(404, { error: 'Rule not found.' });

		return { ruleId: deleted.id };
	},

	deleteSink: async () => {
		requireAdmin();
		const sinkRow = await loadSink();
		const [deleted] = await db.delete(sink).where(eq(sink.id, sinkRow.id))
			.returning();
		if (!deleted)
			return fail(404, { error: 'Sink not found.' });

		throw redirect(303, resolve('/sinks'));
	},
};

async function loadSink() {
	const { params } = getRequestEvent();
	const sinkId = parseNumericId(params.sinkId, 'sinkId');
	return await loadSinkForUser(sinkId);
}
