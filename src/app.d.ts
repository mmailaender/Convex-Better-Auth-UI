// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User } from "$lib/auth/sign-in/user";
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
