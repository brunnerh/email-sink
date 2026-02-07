// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			sessionId: string;
			user: { id: number; email: string } | null;
			isAdmin: boolean;
		}
		interface PageData {
			user: { id: number; email: string } | null;
			isAdmin: boolean;
			isAuthRoute: boolean;
			sinks: {
				id: number;
				name: string;
				slug: string;
				isAuthEnabled: boolean;
			}[];
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
