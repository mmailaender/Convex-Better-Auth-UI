import { fail, redirect } from '@sveltejs/kit';
import { bigEndian } from '@oslojs/binary';
import { env } from '$env/dynamic/private';

import type { Actions, RequestEvent } from './$types';
import { sClient } from '$lib/db/client';
import { fql } from 'fauna';

const allowedUrls = [] as string[];
if (env.VERCEL_URL) {
	allowedUrls.push(`https://${env.VERCEL_URL}`);
}
if (env.VERCEL_BRANCH_URL) {
	allowedUrls.push(`https://${env.VERCEL_BRANCH_URL}`);
}
if (env.CUSTOM_DOMAINS) {
	const customDomains = env.CUSTOM_DOMAINS.split(',').map((domain) => "https://".concat(domain.trim()));
	allowedUrls.push(...customDomains);
}

export async function load() {
	const userId = (await sClient.query<string>(fql`newId()`)).data;
	const credentialUserId = new Uint8Array(8);
	bigEndian.putUint64(credentialUserId, BigInt(userId), 0);

	return {
		userId,
		credentialUserId
	};
}

export const actions: Actions = {
	default: action
};

async function action(event: RequestEvent) {
	const formData = await event.request.formData();
	const firstName = formData.get('firstName');
	const lastName = formData.get('lastName');
	const email = formData.get('email');
	const userId = formData.get('userId');
	const encodedAttestationObject = formData.get('attestationObject');
	const encodedClientDataJSON = formData.get('clientDataJSON');
	if (
		typeof firstName !== 'string' ||
		typeof lastName !== 'string' ||
		typeof email !== 'string' ||
		typeof userId !== 'string' ||
		typeof encodedAttestationObject !== 'string' ||
		typeof encodedClientDataJSON !== 'string'
	) {
		return fail(400, {
			message: 'Invalid or missing fields'
		});
	}

	const response = await event.fetch('/api/auth/webauthn/passkey/sign-up', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			firstName,
			lastName,
			email,
			userId,
			encodedAttestationObject,
			encodedClientDataJSON
		})
	});

	if (!response.ok) {
		return fail(response.status, {
			message: 'Failed to sign up with passkey'
		});
	}

	return redirect(302, '/');
}