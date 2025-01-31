import { createVerification, verifyUserExists } from '$lib/auth/user.server';
import type { RequestEvent, RequestHandler } from './$types';
import { REOON_EMAIL_VERIFIER_TOKEN } from '$env/static/private';
import { getVerificationEmail, sendEmail } from '$lib/emails';
import { error, json } from '@sveltejs/kit';

export const GET: RequestHandler = async (event: RequestEvent) => {
	const url = new URL(event.request.url);
	const email = url.searchParams.get('email');
	const userId = url.searchParams.get('userId');
	console.log('GET request received', { email, userId });
	if (typeof email !== 'string' || (userId !== null && typeof userId !== 'string')) {
		console.error('Invalid or missing fields');
		return error(400, 'Invalid or missing fields');
	}

	const exists = await verifyUserExists(email);
	console.log(`verify-email: Email ${email} exists: ${exists}`);

	if (exists == false) {
		try {
			const response = await fetch(
				`https://emailverifier.reoon.com/api/v1/verify?email=${email}&key=${REOON_EMAIL_VERIFIER_TOKEN}&mode=quick`
			);
			const verificationResult = await response.json();

			if (verificationResult.status !== 'valid') {
				console.warn(`verify-email: Email ${email} is not valid`);
				return error(400, 'Invalid email');
			}

			const otp = await createVerification(email, userId ? userId : undefined);
			const { html } = await getVerificationEmail(otp);

			const { data, error: err } = await sendEmail({
				from: 'verifications@etesie.dev',
				to: email,
				subject: `${otp} is your verification code`,
				html: html
			});

			if (err) {
				return error(400, err.message);
			}
			
			console.log(`verify-email: Successfully send verification email to ${email}, email id: ${data?.id}`);
			return json(true);
		} catch (err) {
			console.error(`verify-email: Error verifying email ${email}`, err);
			return error(500, 'Internal Server Error');
		}
	}

	return new Response(JSON.stringify({ exists }), { status: 200 });
};
