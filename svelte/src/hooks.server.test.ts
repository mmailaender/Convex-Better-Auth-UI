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

/** What a browser sends when a person opens a page. */
const NAVIGATION = { 'sec-fetch-mode': 'navigate', accept: 'text/html,application/xhtml+xml' };

const request = (
	path: string,
	cookie?: string,
	{
		headers = NAVIGATION,
		method = 'GET',
		isDataRequest = false,
		isRemoteRequest = false
	}: {
		headers?: Record<string, string>;
		method?: string;
		isDataRequest?: boolean;
		isRemoteRequest?: boolean;
	} = {}
) => {
	const url = new URL(path, 'https://app.example');
	const event = {
		url,
		request: new Request(url, { method, headers: { ...headers, ...(cookie ? { cookie } : {}) } }),
		cookies: { get: () => undefined },
		fetch,
		isDataRequest,
		isRemoteRequest
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
		expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/auth/get-session?disableRefresh=true');
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

/* A script, an image or a `fetch` can't show the sign-in page: given its HTML, a script throws
   `SyntaxError: Unexpected token '<'`. Only a request that shows its answer as a page, or one
   SvelteKit's router follows, is sent to sign-in. */
describe('protected routes, signed out, for a request that is not a page', () => {
	const SCRIPT = '/admin/widget.js';

	it('answer a script request with 401, not the sign-in page', async () => {
		const response = await request(SCRIPT, undefined, {
			headers: { 'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'script', accept: '*/*' }
		});
		expect(response.status).toBe(401);
		expect(resolve).not.toHaveBeenCalled();
	});

	it('answer a fetch with 401 even when it asks for HTML', async () => {
		const response = await request('/admin', undefined, {
			headers: { 'sec-fetch-mode': 'cors', accept: 'text/html' }
		});
		expect(response.status).toBe(401);
	});

	it('without Fetch Metadata, redirect a request for HTML and answer any other with 401', async () => {
		const page = await redirectOf(
			request('/admin', undefined, { headers: { accept: 'text/html,*/*;q=0.8' } })
		);
		expect(page).toMatchObject({ status: 307 });
		const script = await request(SCRIPT, undefined, { headers: { accept: '*/*' } });
		expect(script.status).toBe(401);
	});

	/* SvelteKit answers a redirect thrown for its client's page data or an enhanced form action
	   with JSON its router follows; a 401 there would end on an error page instead of sign-in. */
	it("still redirect SvelteKit's page data and form action requests", async () => {
		const data = await redirectOf(
			request('/admin/__data.json', undefined, {
				headers: { 'sec-fetch-mode': 'cors', accept: '*/*' },
				isDataRequest: true
			})
		);
		expect(data).toMatchObject({ status: 307 });
		const action = await redirectOf(
			request('/admin', undefined, {
				method: 'POST',
				headers: {
					'sec-fetch-mode': 'cors',
					accept: 'application/json',
					'x-sveltekit-action': 'true'
				}
			})
		);
		expect(action).toMatchObject({ status: 307 });
	});

	/* A remote function's client ignores a redirect thrown in `handle` and resolves to nothing
	   (`remote_request`), so it gets the 401 and fails visibly instead. */
	it('answer a remote function request with 401', async () => {
		const response = await request('/_app/remote/abc/query', undefined, {
			headers: { 'sec-fetch-mode': 'cors', accept: '*/*' },
			isRemoteRequest: true
		});
		expect(response.status).toBe(401);
	});

	it('let a script request with a session cookie through', async () => {
		const response = await request(SCRIPT, VALID_COOKIE, {
			headers: { 'sec-fetch-mode': 'no-cors', accept: '*/*' }
		});
		expect(await response.text()).toBe('page');
	});
});
