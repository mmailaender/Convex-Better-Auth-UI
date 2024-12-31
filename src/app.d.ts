// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User } from '$lib/db/schema/types/custom';
import type { Document } from '$lib/db/schema/types/system';
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: Document<User> | null;
			activeUser: Document<User> | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
