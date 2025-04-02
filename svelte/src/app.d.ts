// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User } from '$lib/db/schema/types/custom';
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
			activeUser: User | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
