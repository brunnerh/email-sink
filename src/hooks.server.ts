import { resolve as resolvePath } from '$app/paths';
import { env } from '$env/dynamic/private';
import { guardCheckStorage } from '$lib/server/auth/guards';
import { db } from '$lib/server/db/index';
import { session, user } from '$lib/server/db/schema';
import type { Handle } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const SessionCookie = 'session_id';

const SessionTtlDays = 30;

const createSession = async () => {
	const id = crypto.randomUUID();
	const expiresAt = new Date(
		Date.now() + SessionTtlDays * 24 * 60 * 60 * 1000,
	);
	await db.insert(session).values({
		id,
		expiresAt,
	});

	return { id, expiresAt };
};

const loadSession = async (sessionId: string) => {
	const [row] = await db.select().from(session).where(
		eq(session.id, sessionId),
	).limit(1);
	return row ?? null;
};

const touchSession = async (sessionId: string, expiresAt: Date) => {
	await db.update(session).set({
		updatedAt: new Date(),
		expiresAt,
	}).where(eq(session.id, sessionId));
};

export const handle: Handle = async ({ event, resolve: handleResolve }) => {
	const theme = event.request.headers.get('sec-ch-prefers-color-scheme') ??
		'light';

	const existingSessionId = event.cookies.get(SessionCookie);
	const now = new Date();
	let sessionRow = existingSessionId
		? await loadSession(existingSessionId)
		: null;
	if (!sessionRow || (sessionRow.expiresAt && sessionRow.expiresAt < now))
		sessionRow = null;

	const sessionData = sessionRow
		? { id: sessionRow.id, expiresAt: sessionRow.expiresAt }
		: await createSession();
	const sessionId = sessionData.id;
	const expiresAt = sessionData.expiresAt ??
		new Date(Date.now() + SessionTtlDays * 24 * 60 * 60 * 1000);

	event.cookies.set(SessionCookie, sessionId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: env.NODE_ENV === 'production',
		maxAge: SessionTtlDays * 24 * 60 * 60,
	});

	await touchSession(sessionId, expiresAt);

	const userRow = sessionRow?.userId
		? (await db.select().from(user).where(eq(user.id, sessionRow.userId))
			.limit(1))[0]
		: null;

	event.locals.sessionId = sessionId;
	event.locals.user = userRow
		? { id: userRow.id, email: userRow.email }
		: null;
	event.locals.isAdmin = !!(userRow && env.ADMIN_EMAIL &&
		userRow.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase());

	type RouteId = typeof event.route.id;

	const routeId = event.route.id as string;
	if (routeId === null)
		error(404, 'Not found');

	const loginRoute: RouteId = '/login';
	const apiRoute: RouteId = '/api';
	const isPublic = routeId.startsWith(loginRoute) ||
		routeId.startsWith(`${apiRoute}/`);

	if (!event.locals.user && !isPublic)
		redirect(303, resolvePath('/login'));

	const checkStore = { checked: false };

	return await guardCheckStorage.run(checkStore, async () => {
		const response = await handleResolve(event, {
			transformPageChunk: (input) => {
				const html = input.html.replace(
					'%theme%',
					theme == 'light' ? 'light' : 'g90',
				);

				return html;
			},
		});

		if (checkStore.checked == false) {
			throw new Error(
				'Guard check not performed for route ' + routeId,
			);
		}

		return response;
	});
};
