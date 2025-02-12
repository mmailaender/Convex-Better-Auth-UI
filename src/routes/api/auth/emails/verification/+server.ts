import type { RequestEvent, RequestHandler } from './$types';

import { getVerificationEmail, sendEmail } from '$lib/email/templates';

export const POST: RequestHandler = async (event: RequestEvent) => {
	const { OTP, emailTo } = await event.request.json();
	// const baseURL = new URL(event.request.url).origin;

	const { html } = await getVerificationEmail(OTP);

	const { data, error } = await sendEmail({
		from: 'verifications@etesie.dev',
		to: emailTo,
		subject: `${OTP} is your verification code`,
		html: html
	});

	if (error) {
		return new Response(error.message, { status: 400 });
	}

	return new Response(JSON.stringify(data));
};
