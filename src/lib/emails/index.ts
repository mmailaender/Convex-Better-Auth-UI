import type { Component, ComponentProps } from 'svelte';
import { render as svelteRender } from 'svelte/server';
import { render as maizzleRender, type Config } from '@maizzle/framework';
import tailwindcssPresetEmail from 'tailwindcss-preset-email';
import tailwindConfig from '../../../tailwind.config';

import Registration from './Registration.svelte';
import Verification from './Verification.svelte';

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
				theme: tailwindConfig.theme,
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

const getRegistrationEmail = async (OTP: string) => {
	const componentProps: ComponentProps<typeof Registration> = {
		OTP
	};

	return await render(Registration, componentProps);
};

const getVerificationEmail = async (firstName: string, OTP: string, baseURL: string) => {
	const componentProps: ComponentProps<typeof Verification> = {
		firstName,
		OTP,
		baseURL
	};

	return await render(Verification, componentProps);
};

export { getRegistrationEmail, getVerificationEmail };
