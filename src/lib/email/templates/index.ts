import type { Component, ComponentProps } from 'svelte';
import { render as svelteRender } from 'svelte/server';
import { render as maizzleRender, type Config } from '@maizzle/framework';
import tailwindcssPresetEmail from 'tailwindcss-preset-email';
import tailwindConfig from '../../../../tailwind.config';

import Verification from './Verification.svelte';
import { RESEND_API_KEY } from '$env/static/private';
import { Resend } from 'resend';

const maizzleConfig = (input: string) => {
	return {
		css: {
			shorthand: true,
			tailwind: {
				presets: [tailwindcssPresetEmail],
				content: [
					{
						raw: input,
						extension: 'html'
					}
				],
				theme: tailwindConfig.theme
				// plugins: tailwindConfig.plugins
			}
		}
	} as Config;
};

const enrichBody = (body: string) => {
	return `<!doctype html>
    <html>
    <head>
        <style>
            @tailwind components;
            @tailwind utilities;
        </style>
    </head>
    <body>
        ${body}
    </body>
    </html>`;
};

const render = async <T extends Record<string, unknown>>(component: Component<T>, props: T) => {
	const { body } = await svelteRender(component, { props });
	const html = enrichBody(body);

	return await maizzleRender(html, maizzleConfig(html));
};

export interface SendEmailInput {
	from: string;
	to: string;
	subject: string;
	html: string;
}

const send = async ({ from, to, subject, html }: SendEmailInput) => {
	const resend = new Resend(RESEND_API_KEY);

	return await resend.emails.send({
		from: from,
		to: to,
		subject: subject,
		html: html
	});
};

const getVerificationEmail = async (OTP: string) => {
	const componentProps: ComponentProps<typeof Verification> = {
		OTP
	};

	return await render(Verification, componentProps);
};

export { send as sendEmail, getVerificationEmail };
