import { expect, test, vi } from 'vitest';
import { render } from 'svelte/server';
import { getFunctionName } from 'convex/server';
import type { FunctionReference } from 'convex/server';
import type { getAuthContext } from '#lib/auth/context.svelte.js';
import OrganizationSwitcher from './OrganizationSwitcher.svelte';

/* The server render, what a page shows before it hydrates: a press then reaches no handler
   and is lost, so the switcher and "Create Organization" are marked not ready
   (WaitsForHydration). */
const organization = { id: 'org-1', name: 'Analytical Engines', slug: 'analytical-engines' };
const data = vi.hoisted(() => ({ organizations: [] as unknown[] }));

vi.mock(import('#lib/auth/context.svelte.js'), async () => {
	const { anyApi } = await import('convex/server');
	return {
		getAuthContext: () =>
			({
				api: anyApi,
				authClient: {},
				authConstants: { organizations: true }
			}) as unknown as ReturnType<typeof getAuthContext>
	};
});

vi.mock('@mmailaender/convex-better-auth-svelte/svelte', () => ({
	useAuth: () => ({ isAuthenticated: true, isLoading: false })
}));

vi.mock('convex-svelte', () => ({
	useConvexClient: () => ({}),
	useQuery: (query: FunctionReference<'query'>) => {
		const name = getFunctionName(query);
		if (name.endsWith(':listOrganizations')) return { data: data.organizations, isLoading: false };
		if (name.endsWith(':getActiveOrganization')) {
			return { data: data.organizations[0], isLoading: false };
		}
		if (name.endsWith(':getOrganizationRole')) return { data: 'owner', isLoading: false };
		throw new Error(`Unexpected query ${name}`);
	}
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

test('the server renders the switcher inside a not-ready wrapper', () => {
	data.organizations = [organization];
	const { body } = render(OrganizationSwitcher);

	const trigger = /<button[^>]*data-scope="popover"[^>]*data-part="trigger"/;
	expect(body).toMatch(trigger);
	const wrapped = insideNotReadyWrappers(body).filter((inside) => trigger.test(inside));
	expect(wrapped).toHaveLength(1);
	// the whole button, its organization name included, sits inside the wrapper
	expect(wrapped[0]).toMatch(/Analytical Engines\s*<\/span><\/div>.*<\/button>(?:<!--[^>]*-->)*$/s);
	// the mark sits on the wrapper, so the button itself keeps its look
	expect(wrapped[0]).not.toMatch(/<button[^>]*aria-disabled/);
});

test('the server renders "Create Organization" inside a not-ready wrapper', () => {
	data.organizations = [];
	const { body } = render(OrganizationSwitcher);

	const trigger =
		/<button[^>]*data-scope="dialog"[^>]*data-part="trigger"[^>]*>.*Create Organization/s;
	expect(body).toMatch(trigger);
	const wrapped = insideNotReadyWrappers(body).filter((inside) => trigger.test(inside));
	expect(wrapped).toHaveLength(1);
	expect(wrapped[0]).not.toMatch(/<button[^>]*aria-disabled/);
});
