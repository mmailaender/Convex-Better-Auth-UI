import { redirect } from "@sveltejs/kit";
import sClient from '$lib/db/serverClient';
import { fql } from 'fauna';
import { bigEndian } from '@oslojs/binary';

import type { RequestEvent } from "./$types";

export async function load(event: RequestEvent) {
	// If the user is already signed in, redirect home
	if (event.locals.user !== null) {
		throw redirect(302, "/");
	}

	// Generate IDs for a potential new user verification flow
	const userId = (await sClient.query<string>(fql`newId()`)).data;
	const credentialUserId = new Uint8Array(8);
	bigEndian.putUint64(credentialUserId, BigInt(userId), 0);

	return {
		userId,
		credentialUserId
	};
}
