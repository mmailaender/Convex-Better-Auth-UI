import { createRegistration, verifyUserExists } from '$lib/auth/user';
import type { RequestEvent, RequestHandler } from './$types';

export const POST: RequestHandler = async (event: RequestEvent) => {
	const data = await event.request.json();
	const email = data.email as unknown as string;
	if (typeof email !== 'string') {
		return new Response('Invalid or missing email', { status: 400 });
	}

	const exists = await verifyUserExists(email);

	if(exists == false) {
		// TODO: Add code to validate email through reoon


		const otp = await createRegistration(email);

		// TODO: send email with OTP
	}

	return new Response(JSON.stringify({ exists }), { status: 200 });
};
