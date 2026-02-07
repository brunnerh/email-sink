import { resolve } from '$app/paths';
import { parseNumericId } from '$lib/server/api/params';
import { requireAdmin } from '$lib/server/auth/guards';
import { db } from '$lib/server/db/index';
import { sink } from '$lib/server/db/schema';
import { loadSinkForUser } from '$lib/server/sinks/queries';
import { slugify } from '$lib/server/sinks/slug';
import { checkboxBoolean, requiredString } from '$lib/server/validation';
import type { Actions, ServerLoad } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export const load: ServerLoad = async ({ params }) => {
	requireAdmin();
	const sinkId = parseNumericId(params.sinkId, 'sinkId');
	const sinkRow = await loadSinkForUser(sinkId);

	return { sink: sinkRow };
};

export const actions: Actions = {
	updateSink: async ({ params, request }) => {
		requireAdmin();
		const sinkId = parseNumericId(params.sinkId, 'sinkId');
		await loadSinkForUser(sinkId);

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

		const [updated] = await db.update(sink).set({
			name: parsed.data.name,
			slug,
			isAuthEnabled: parsed.data.isAuthEnabled,
		}).where(eq(sink.id, sinkId)).returning();
		if (!updated)
			return fail(404, { error: 'Sink not found.' });

		throw redirect(303, resolve(`/sinks/${updated.id}/settings`));
	},
};
