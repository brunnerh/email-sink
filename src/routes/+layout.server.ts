import { requireNone } from '$lib/server/auth/guards';
import { listSinksForUser } from '$lib/server/sinks/queries';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals, route }) => {
	requireNone();

	const isAuthRoute = route.id == '/login';

	return {
		user: locals.user,
		isAdmin: locals.isAdmin,
		isAuthRoute,
		sinks: isAuthRoute ? [] : await listSinksForUser(),
	};
}) satisfies LayoutServerLoad;
