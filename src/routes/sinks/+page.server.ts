import { db } from '$lib/server/db';
import { email } from '$lib/server/db/schema';
import { requireNone } from '$lib/server/auth/guards';
import { listSinksForUser } from '$lib/server/sinks/queries';
import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	requireNone();
	const sinks = await listSinksForUser();

	const counts = await db
		.select({
			sinkId: email.sinkId,
			count: sql<number>`count(*)`,
		})
		.from(email)
		.groupBy(email.sinkId);

	return {
		sinks: sinks.map((sink) => ({
			...sink,
			emailCount: Number(
				counts.find((row) => row.sinkId === sink.id)?.count ?? 0,
			),
		})),
	};
};
