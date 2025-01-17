import type { RequestEvent, RequestHandler } from './$types';

import { render } from 'svelte/server';
import type { ComponentProps } from 'svelte';
import Verification from '$lib/emails/Verification.svelte';
import { RESEND_API_KEY } from '$env/static/private';
import { Resend } from 'resend';

export const POST: RequestHandler = async (event: RequestEvent) => {
	const { firstName, OTP, emailTo } = await event.request.json();
	const baseURL = new URL(event.request.url).origin;

	const componentProps: ComponentProps<typeof Verification> = {
		firstName,
		OTP,
		baseURL
	};

	const { html } = render(Verification, { props: componentProps });

	const resend = new Resend(RESEND_API_KEY);

	const { data, error } = await resend.emails.send({
		from: 'support@etesie.dev',
		to: emailTo,
		subject: 'OTP verification',
		html: html,
	});

	if (error) {
		return new Response(error.message, { status: 400 });
	}

	return new Response(JSON.stringify(data));
};
