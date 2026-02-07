import { requireNone } from '$lib/server/auth/guards';
import { db } from '$lib/server/db/index';
import { session } from '$lib/server/db/schema';
import type { RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { LoginStatusUpdate } from '$lib/shared/login-status-update';

const PollIntervalMs = 5000;
const MaxDurationMs = 10 * 60 * 1000;

export const GET: RequestHandler = ({ locals }) => {
	requireNone();
	const encoder = new TextEncoder();
	const startedAt = Date.now();
	const sessionId = locals.sessionId;
	let cancelled = false;

	const readable = new ReadableStream({
		async start(controller) {
			while (!cancelled && Date.now() - startedAt < MaxDurationMs) {
				const [row] = await db
					.select({ userId: session.userId })
					.from(session)
					.where(eq(session.id, sessionId))
					.limit(1);

				if (row?.userId) {
					sendUpdate({ status: 'success' });
					controller.close();
					return;
				}
				else {
					sendUpdate({ status: 'pending' });
				}

				await new Promise((resolve) =>
					setTimeout(resolve, PollIntervalMs)
				);
			}

			if (!cancelled) {
				sendUpdate({ status: 'timeout' });
				controller.close();
			}

			function sendUpdate(update: LoginStatusUpdate) {
				controller.enqueue(encoder.encode([
					'event: status-update\n',
					`data: ${JSON.stringify(update)}\n\n`,
				].join('')));
			}
		},
		cancel() {
			cancelled = true;
		},
	});

	return new Response(readable, {
		headers: {
			'Content-Type': 'text/event-stream; charset=utf-8',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		},
	});
};
