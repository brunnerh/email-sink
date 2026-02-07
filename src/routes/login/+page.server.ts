import { db } from '$lib/server/db/index';
import { loginKey } from '$lib/server/db/schema';
import { generateLoginKey, hashLoginKey } from '$lib/server/auth/keys';
import { requireNone } from '$lib/server/auth/guards';
import { createSendEmailService } from '$lib/server/emails/sending';
import { env } from '$env/dynamic/private';
import { resolve as resolvePath } from '$app/paths';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, ServerLoad } from '@sveltejs/kit';
import { z } from 'zod';

const LoginKeyTtlMinutes = 10;

export const load: ServerLoad = ({ locals }) => {
	requireNone();
	if (locals.user)
		throw redirect(303, resolvePath('/'));
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		requireNone();
		const formData = await request.formData();
		const parsed = z.email().safeParse(formData.get('email'));
		if (!parsed.success) {
			return fail(400, {
				error: parsed.error.issues[0]?.message ??
					'Enter a valid email address.',
			});
		}
		const email = parsed.data.toLowerCase();

		const key = generateLoginKey();
		const keyHash = hashLoginKey(key);
		const expiresAt = new Date(
			Date.now() + LoginKeyTtlMinutes * 60 * 1000,
		);

		await db.insert(loginKey).values({
			keyHash,
			sessionId: locals.sessionId,
			email,
			expiresAt,
		});

		const emailService = createSendEmailService();
		const from = env.EMAIL_FROM;
		if (from == null)
			throw new Error('EMAIL_FROM is not set');

		const baseUrl = env.APP_BASE_URL ?? url.origin;
		const loginUrl = new URL(resolvePath('/login/verify'), baseUrl);
		loginUrl.searchParams.set('key', key);

		await emailService.sendEmail({
			subject: 'Sign in to Email Sink',
			contentType: 'text/plain',
			content:
				`Use the link below to sign in. This link expires in ${LoginKeyTtlMinutes} minutes.\n\n${loginUrl.toString()}`,
			from,
			to: [email],
		});

		return { success: true };
	},
};
