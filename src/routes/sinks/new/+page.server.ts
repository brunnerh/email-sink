import { db } from '$lib/server/db/index';
import { sink } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/auth/guards';
import { slugify } from '$lib/server/sinks/slug';
import { checkboxBoolean, requiredString } from '$lib/server/validation';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';

export const load: ServerLoad = () => {
	requireAdmin();
};

export const actions: Actions = {
	createSink: async ({ locals, request }) => {
		requireAdmin();
		const formData = await request.formData();
		const schema = z.object({
			name: requiredString,
			slug: z.string().optional(),
			isAuthEnabled: checkboxBoolean,
		});
		const parsed = schema.safeParse({
			name: formData.get('name'),
			slug: formData.get('slug'),
			isAuthEnabled: formData.get('isAuthEnabled'),
		});
		if (!parsed.success) {
			return fail(400, {
				error: parsed.error.issues[0]?.message ?? 'Invalid form data.',
			});
		}

		const slug = slugify(parsed.data.slug ?? parsed.data.name);
		if (!slug)
			return fail(400, { error: 'Slug is required.' });

		const [created] = await db.insert(sink).values({
			name: parsed.data.name,
			slug,
			isAuthEnabled: parsed.data.isAuthEnabled,
			createdByUserId: locals.user!.id,
		}).returning();

		throw redirect(303, `/sinks/${created.id}`);
	},
};
