import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db/index';
import { sink, sinkApiKey, sinkAuthRule } from '$lib/server/db/schema';
import { isEmailAuthorizedForSink } from './authorization';
import { error } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';

export const listSinksForUser = async () => {
	const { locals } = getRequestEvent();
	const { user, isAdmin } = locals;
	const email = user?.email ?? null;

	if (email == null)
		return [];

	const sinks = await db.select().from(sink).orderBy(sink.name);

	if (isAdmin)
		return sinks;

	if (sinks.length === 0)
		return [];

	const rules = await db.select().from(sinkAuthRule).where(inArray(
		sinkAuthRule.sinkId,
		sinks.map((row) => row.id),
	));

	const rulesBySink = new Map<number, typeof rules>();
	for (const rule of rules) {
		const existing = rulesBySink.get(rule.sinkId) ?? [];
		existing.push(rule);
		rulesBySink.set(rule.sinkId, existing);
	}

	return sinks.filter((row) =>
		isEmailAuthorizedForSink(email, rulesBySink.get(row.id) ?? [])
	);
};

export const loadSinkForUser = async (sinkId: number) => {
	const { locals } = getRequestEvent();
	const { isAdmin, user } = locals;
	const email = user?.email ?? null;

	const [sinkRow] = await db.select().from(sink).where(eq(sink.id, sinkId))
		.limit(1);
	if (!sinkRow)
		error(404, 'Sink not found');

	if (isAdmin)
		return sinkRow;

	if (!email)
		error(403, 'Forbidden');

	const rules = await db.select().from(sinkAuthRule).where(
		eq(sinkAuthRule.sinkId, sinkId),
	);
	if (!isEmailAuthorizedForSink(email, rules))
		error(403, 'Forbidden');

	return sinkRow;
};

export const listSinkApiKeys = async (sinkId: number) =>
	await db.select().from(sinkApiKey).where(eq(sinkApiKey.sinkId, sinkId));

export const listSinkAuthRules = async (sinkId: number) =>
	await db.select().from(sinkAuthRule).where(eq(sinkAuthRule.sinkId, sinkId));
