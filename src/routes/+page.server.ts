import { resolve } from '$app/paths';
import { requireNone } from '$lib/server/auth/guards';
import { redirect } from '@sveltejs/kit';

export const load = () => {
	requireNone();
	redirect(303, resolve('/sinks'));
};
