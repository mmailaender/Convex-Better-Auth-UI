import { redirect } from "@sveltejs/kit";

import type { RequestEvent } from "./$types";

export async function load(event: RequestEvent) {
	if (event.locals.user !== null) {
		return redirect(302, "/");
	}
	return {};
}