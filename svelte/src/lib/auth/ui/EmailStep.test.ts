import { expect, test, vi } from 'vitest';
import { render } from 'svelte/server';
import type { getAuthContext } from '#lib/auth/context.svelte.js';
import EmailStep from './EmailStep.svelte';

vi.mock(import('#lib/auth/context.svelte.js'), async () => {
	const { anyApi } = await import('convex/server');
	return {
		getAuthContext: () =>
			({ api: anyApi, authClient: {}, authConstants: {} }) as unknown as ReturnType<
				typeof getAuthContext
			>
	};
});

vi.mock('convex-svelte', () => ({ useConvexClient: () => ({}) }));

test('the "Email" label names the email field', () => {
	const { body } = render(EmailStep, {
		props: {
			email: '',
			onEmailChange: () => {},
			onMethodSelect: () => {},
			submitting: false,
			availableMethods: ['password']
		}
	});

	const label = body.match(/<label[^>]*for="([^"]*)"[^>]*>Email<\/label>/);
	expect(label).not.toBeNull();
	expect(body).toMatch(new RegExp(`<input[^>]*id="${label![1]}"[^>]*type="email"`));
});
