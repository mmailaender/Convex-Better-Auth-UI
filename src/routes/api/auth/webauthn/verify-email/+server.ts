import { createVerification, verifyUserExists } from '$lib/auth/user';
import type { RequestEvent, RequestHandler } from './$types';
import { REOON_EMAIL_VERIFIER_TOKEN } from '$env/static/private';

export const GET: RequestHandler = async (event: RequestEvent) => {
	const url = new URL(event.request.url);
	const email = url.searchParams.get('email');
	const userId = url.searchParams.get('userId');
	console.log('GET request received', { email, userId });
	if (typeof email !== 'string' || (userId !== null && typeof userId !== 'string')) {
		console.error('Invalid or missing fields');
		return new Response('Invalid or missing fields', { status: 400 });
	}

	const exists = await verifyUserExists(email);
	console.log(`check-email: Email ${email} exists: ${exists}`);

	if (exists == false) {
		try {
			const response = await fetch(
				`https://emailverifier.reoon.com/api/v1/verify?email=${email}&key=${REOON_EMAIL_VERIFIER_TOKEN}&mode=quick`
			);
			const verificationResult = await response.json();

			if (verificationResult.status !== 'valid') {
				console.warn(`verify-email: Email ${email} is not valid`);
				return new Response('Invalid email', { status: 400 });
			}

			const otp = await createVerification(email, userId ? userId : undefined);

			// TODO: send email with OTP

			console.log(`check-email: Successfully verified email ${email}`);
		} catch (err) {
			console.error(`check-email: Error verifying email ${email}`, err);
			return new Response('Internal Server Error', { status: 500 });
		}
	}

	return new Response(JSON.stringify({ exists }), { status: 200 });
};
