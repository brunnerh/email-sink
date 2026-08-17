import { requireNone } from '$lib/server/auth/guards';
import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = () => {
	requireNone();
};
