import { createRegistration, verifyUserExists } from '$lib/auth/user';
import type { RequestEvent, RequestHandler } from './$types';
import { REOON_EMAIL_VERIFIER_TOKEN } from '$env/static/private';

export const POST: RequestHandler = async (event: RequestEvent) => {
	const data = await event.request.json();
	const email = data.email as unknown as string;
	if (typeof email !== 'string') {
		return new Response('Invalid or missing email', { status: 400 });
	}

	const exists = await verifyUserExists(email);

	if (exists == false) {
		const response = await fetch(
			`https://emailverifier.reoon.com/api/v1/verify?email=${email}&key=${REOON_EMAIL_VERIFIER_TOKEN}&mode=quick`
		);
		const verificationResult = await response.json();

		if (verificationResult.status !== 'valid') {
			return new Response('Invalid email', { status: 400 });
		}

		const otp = await createRegistration(email);

		// TODO: send email with OTP
	}

	return new Response(JSON.stringify({ exists }), { status: 200 });
};
