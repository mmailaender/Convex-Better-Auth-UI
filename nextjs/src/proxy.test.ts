import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

// `node --test` strips types but knows neither the `@/` paths nor `next/server` without `.js`
registerHooks({
	resolve(specifier, context, nextResolve) {
		if (specifier === 'next/server') return nextResolve('next/server.js', context);
		if (specifier.startsWith('@/')) {
			const path = `${specifier.slice(2)}.ts`;
			return nextResolve(new URL(path, import.meta.url).href, context);
		}
		return nextResolve(specifier, context);
	}
});

const { NextRequest } = await import('next/server');
const { proxy } = await import('./proxy.ts');

// The cookie Better Auth no longer reads once its cookies are `__Secure-`
const STALE_COOKIE = 'better-auth.session_token=stale.signature';
const VALID_COOKIE = '__Secure-better-auth.session_token=valid.signature';
const SESSION = { session: { id: 'session-1' }, user: { id: 'user-1' } };
const ORIGIN = 'https://app.example';

const request = (path: string, cookie?: string) =>
	proxy(new NextRequest(new URL(path, ORIGIN), { headers: cookie ? { cookie } : {} }));

/** Where the proxy redirects to, or `undefined` when it lets the request through. */
const redirectOf = (response: Response) => response.headers.get('location') ?? undefined;

let fetchMock: ReturnType<typeof mock.method<typeof globalThis, 'fetch'>>;

beforeEach(() => {
	fetchMock = mock.method(globalThis, 'fetch', async () => Response.json(null));
});

afterEach(() => {
	mock.restoreAll();
});

describe('sign-in guard', () => {
	it('shows sign-in with a stale session cookie that has no session', async () => {
		assert.equal(redirectOf(await request('/signin', STALE_COOKIE)), undefined);

		assert.equal(fetchMock.mock.callCount(), 1);
		const [url, init] = fetchMock.mock.calls[0].arguments;
		assert.equal(String(url), `${ORIGIN}/api/auth/get-session`);
		assert.equal(new Headers(init?.headers).get('cookie'), STALE_COOKIE);
	});

	it('shows sign-in when the session check fails', async () => {
		fetchMock.mock.mockImplementationOnce(async () => new Response('Bad gateway', { status: 502 }));
		assert.equal(redirectOf(await request('/signin', STALE_COOKIE)), undefined);

		fetchMock.mock.mockImplementationOnce(async () => {
			throw new TypeError('fetch failed');
		});
		assert.equal(redirectOf(await request('/signin', STALE_COOKIE)), undefined);
	});

	it('sends a reader with a valid session home', async () => {
		fetchMock.mock.mockImplementation(async () => Response.json(SESSION));

		const response = await request('/signin', VALID_COOKIE);
		assert.equal(response.status, 307);
		assert.equal(redirectOf(response), `${ORIGIN}/`);
	});

	it('shows sign-in without asking for the session when there is no cookie', async () => {
		assert.equal(redirectOf(await request('/signin')), undefined);
		assert.equal(fetchMock.mock.callCount(), 0);
	});
});

describe('protected routes', () => {
	it('let any session cookie through without asking for the session', async () => {
		assert.equal(redirectOf(await request('/admin', STALE_COOKIE)), undefined);
		assert.equal(fetchMock.mock.callCount(), 0);
	});

	it('send a reader without a session cookie to sign-in, returning afterwards', async () => {
		assert.equal(
			redirectOf(await request('/admin?tab=users')),
			`${ORIGIN}/signin?redirectTo=%2Fadmin%3Ftab%3Dusers`
		);
	});
});
