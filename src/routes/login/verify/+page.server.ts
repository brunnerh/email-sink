import { db } from '$lib/server/db/index';
import { loginKey, session, user } from '$lib/server/db/schema';
import { hashLoginKey } from '$lib/server/auth/keys';
import { requireNone } from '$lib/server/auth/guards';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { resolve as resolvePath } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals, url }) => {
	requireNone();
	const key = url.searchParams.get('key');
	if (!key)
		throw redirect(303, resolvePath('/login'));

	const keyHash = hashLoginKey(key);
	const now = new Date();

	const [keyRow] = await db.select().from(loginKey).where(and(
		eq(loginKey.keyHash, keyHash),
		gt(loginKey.expiresAt, now),
		isNull(loginKey.usedAt),
	)).limit(1);

	if (!keyRow)
		throw redirect(303, resolvePath('/login'));

	await db.transaction(async (tx) => {
		const [existingUser] = await tx.select().from(user).where(
			eq(user.email, keyRow.email),
		).limit(1);
		const userRow = existingUser
			? existingUser
			: (await tx.insert(user).values({ email: keyRow.email })
				.returning())[0];

		await tx.update(session).set({
			userId: userRow.id,
			updatedAt: new Date(),
		}).where(eq(session.id, keyRow.sessionId));

		await tx.update(user).set({ lastLoginAt: now }).where(
			eq(user.id, userRow.id),
		);

		await tx.update(loginKey).set({ usedAt: now }).where(
			eq(loginKey.id, keyRow.id),
		);
	});

	if (locals.sessionId === keyRow.sessionId)
		throw redirect(303, resolvePath('/'));

	return { verified: true };
};
