import { isRedirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/env', () => ({ building: false }));

// The auth guard of `handle`; SvelteKit's `sequence` needs a live request to run.
const { requireAuth } = await import('./hooks.server');

// The cookie Better Auth no longer reads once its cookies are `__Secure-`
const STALE_COOKIE = 'better-auth.session_token=stale.signature';
const VALID_COOKIE = '__Secure-better-auth.session_token=valid.signature';
const SESSION = { session: { id: 'session-1' }, user: { id: 'user-1' } };

const fetch = vi.fn<typeof globalThis.fetch>();
const resolve = vi.fn(async () => new Response('page'));

const request = (path: string, cookie?: string) => {
	const url = new URL(path, 'https://app.example');
	const event = {
		url,
		request: new Request(url, { headers: cookie ? { cookie } : {} }),
		cookies: { get: () => undefined },
		fetch
	};
	return requireAuth({ event, resolve } as unknown as Parameters<typeof requireAuth>[0]);
};

/** The redirect the guard throws, or `undefined` when it resolves the page. */
const redirectOf = async (response: ReturnType<typeof requireAuth>) => {
	try {
		await response;
		return undefined;
	} catch (error) {
		if (isRedirect(error)) return error;
		throw error;
	}
};

beforeEach(() => {
	fetch.mockReset();
	resolve.mockClear();
});

describe('sign-in guard', () => {
	it('shows sign-in with a stale session cookie that has no session', async () => {
		fetch.mockResolvedValue(Response.json(null));

		expect(await redirectOf(request('/signin', STALE_COOKIE))).toBeUndefined();
		expect(resolve).toHaveBeenCalledOnce();
		expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/auth/get-session');
	});

	it('shows sign-in when the session check fails', async () => {
		fetch.mockResolvedValueOnce(new Response('Bad gateway', { status: 502 }));
		expect(await redirectOf(request('/signin', STALE_COOKIE))).toBeUndefined();

		fetch.mockRejectedValueOnce(new TypeError('fetch failed'));
		expect(await redirectOf(request('/signin', STALE_COOKIE))).toBeUndefined();

		expect(resolve).toHaveBeenCalledTimes(2);
	});

	it('sends a reader with a valid session home', async () => {
		fetch.mockResolvedValue(Response.json(SESSION));

		const redirect = await redirectOf(request('/signin', VALID_COOKIE));
		expect(redirect).toMatchObject({ status: 307, location: '/' });
		expect(resolve).not.toHaveBeenCalled();
	});

	it('shows sign-in without asking for the session when there is no cookie', async () => {
		expect(await redirectOf(request('/signin'))).toBeUndefined();
		expect(fetch).not.toHaveBeenCalled();
	});
});

describe('protected routes', () => {
	it('let any session cookie through without asking for the session', async () => {
		expect(await redirectOf(request('/admin', STALE_COOKIE))).toBeUndefined();
		expect(resolve).toHaveBeenCalledOnce();
		expect(fetch).not.toHaveBeenCalled();
	});

	it('send a reader without a session cookie to sign-in, returning afterwards', async () => {
		const redirect = await redirectOf(request('/admin?tab=users'));
		expect(redirect).toMatchObject({
			status: 307,
			location: '/signin?redirectTo=%2Fadmin%3Ftab%3Dusers'
		});
	});
});
