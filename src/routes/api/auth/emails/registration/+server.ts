import type { RequestEvent, RequestHandler } from './$types';

import { RESEND_API_KEY } from '$env/static/private';
import { Resend } from 'resend';
import { getRegistrationEmail } from '$lib/emails';

export const POST: RequestHandler = async (event: RequestEvent) => {
	const { OTP, emailTo } = await event.request.json();

	const { html } = await getRegistrationEmail(OTP);

	const resend = new Resend(RESEND_API_KEY);

	const { data, error } = await resend.emails.send({
		from: 'support@etesie.dev',
		to: emailTo,
		subject: 'OTP verification',
		html: html
	});

	if (error) {
		return new Response(error.message, { status: 400 });
	}

	return new Response(JSON.stringify(data));
};
