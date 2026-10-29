import { expect, test, vi } from 'vitest';
import { render } from 'svelte/server';
import UserButton from './UserButton.svelte';

/* The server render, what a page shows before it hydrates: a press then reaches no handler
   and is lost, so the account button and "Sign in" are marked not ready (WaitsForHydration). */
const session = vi.hoisted(() => ({ signedIn: true }));

vi.mock('#lib/auth/context.svelte.js', async () => {
	const { anyApi } = await import('convex/server');
	return { getAuthContext: () => ({ api: anyApi, authClient: {}, authConstants: {} }) };
});

vi.mock('@mmailaender/convex-better-auth-svelte/svelte', () => ({
	useAuth: () => ({ isAuthenticated: session.signedIn, isLoading: false })
}));

vi.mock('convex-svelte', () => ({
	useConvexClient: () => ({}),
	useQuery: () => ({ data: { name: 'Ada Lovelace', email: 'ada@example.com' } })
}));

const WRAPPER = '<span class="contents" aria-disabled="true">';

/** The markup inside each not-ready wrapper, up to the wrapper's own closing tag. */
function insideNotReadyWrappers(body: string): string[] {
	const contents: string[] = [];
	for (let start = body.indexOf(WRAPPER); start !== -1; start = body.indexOf(WRAPPER, start + 1)) {
		const tags = /<span\b[^>]*>|<\/span>/g;
		tags.lastIndex = start + WRAPPER.length;
		let depth = 1;
		let tag: RegExpExecArray | null = null;
		while (depth > 0 && (tag = tags.exec(body))) depth += tag[0] === '</span>' ? -1 : 1;
		if (!tag) throw new Error('The wrapper is never closed');
		contents.push(body.slice(start + WRAPPER.length, tag.index));
	}
	return contents;
}

test('the server renders the account button inside a not-ready wrapper', () => {
	session.signedIn = true;
	const { body } = render(UserButton);

	const trigger = /<button[^>]*data-scope="popover"[^>]*data-part="trigger"/;
	expect(body).toMatch(trigger);
	const wrapped = insideNotReadyWrappers(body).filter((inside) => trigger.test(inside));
	expect(wrapped).toHaveLength(1);
	// the mark sits on the wrapper, so the button itself keeps its look
	expect(wrapped[0]).not.toMatch(/<button[^>]*aria-disabled/);
});

test('the server renders "Sign in" inside a not-ready wrapper', () => {
	session.signedIn = false;
	const { body } = render(UserButton);

	const signIn = /<button[^>]*>\s*Sign in\s*<\/button>/;
	expect(body).toMatch(signIn);
	const wrapped = insideNotReadyWrappers(body).filter((inside) => signIn.test(inside));
	expect(wrapped).toHaveLength(1);
	expect(wrapped[0]).not.toMatch(/<button[^>]*aria-disabled/);
});
