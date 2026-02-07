import { getRequestEvent } from '$app/server';
import { error } from '@sveltejs/kit';
import { AsyncLocalStorage } from 'node:async_hooks';

export const guardCheckStorage = new AsyncLocalStorage<{
	checked: boolean;
}>();

/**
 * Requires the user to be an admin. Throws a 403 error if not.
 */
export function requireAdmin() {
	guardCheckStorage.getStore()!.checked = true;

	const { locals } = getRequestEvent();
	if (!locals.isAdmin)
		throw error(403, 'Forbidden');

	return locals.user;
}

/**
 * Does not add any user requirements.\
 * Has to be used in routes where no other guards apply.
 */
export function requireNone() {
	guardCheckStorage.getStore()!.checked = true;
}
