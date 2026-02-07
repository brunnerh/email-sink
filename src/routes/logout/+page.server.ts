import { db } from '$lib/server/db/index';
import { session } from '$lib/server/db/schema';
import { resolve } from '$app/paths';
import { requireNone } from '$lib/server/auth/guards';
import { redirect, type ServerLoad } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { SessionCookie } from '../../hooks.server.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies, locals }) => {
		requireNone();

		if (locals.user == null)
			redirect(303, resolve('/'));

		cookies.delete(SessionCookie, { path: '/' });

		try {
			await db.delete(session).where(eq(session.id, locals.sessionId));
		}
		catch {
			// ignore errors
		}

		redirect(303, resolve('/'));
	},
};
