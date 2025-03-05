import { error, json } from '@sveltejs/kit';
import { createAndSendVerification, verifyEmail } from '$lib/email/api/server';
import type { RequestEvent, RequestHandler } from './$types';

export const GET: RequestHandler = async (event: RequestEvent) => {
	const url = new URL(event.request.url);
	const email = url.searchParams.get('email');
	const userId = url.searchParams.get('userId');
	console.log('GET request received', { email, userId });

	if (typeof email !== 'string' || (userId !== null && typeof userId !== 'string')) {
		console.error('Invalid or missing fields');
		return error(400, 'Invalid or missing fields');
	}

	try {
		const emailVerificationResult = await verifyEmail(email);
		if (!emailVerificationResult.valid) {
			return json({ emailVerificationResult });
		}
		await createAndSendVerification(email, userId || undefined);
		return json({ emailVerificationResult });
	} catch (err) {
		console.error(`verify-email: Error verifying email ${email}`, err);
		return error(500, 'Internal Server Error');
	}
};
