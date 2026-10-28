// Tests shared/convex code from the Svelte app: inside shared/convex, the
// vitest import would break the Next.js and Convex typechecks.
import { afterEach, describe, expect, it } from 'vitest';
import { createCookieGetter } from 'better-auth/cookies';
import { getBetterAuthBaseUrl, resolveSecureCookies } from '../../../convex/url';

const env = { ...process.env };

afterEach(() => {
	process.env = { ...env };
});

describe('resolveSecureCookies', () => {
	it('makes cookies Secure with an https fallback URL', () => {
		expect(resolveSecureCookies(undefined, 'https://app.example.com')).toBe(true);
	});

	it('leaves the decision to Better Auth with an http fallback URL or none', () => {
		expect(resolveSecureCookies(undefined, 'http://localhost:5173')).toBe(undefined);
		expect(resolveSecureCookies(undefined, undefined)).toBe(undefined);
		expect(resolveSecureCookies(undefined, '')).toBe(undefined);
		expect(resolveSecureCookies(undefined, 'app.example.com')).toBe(undefined);
	});

	it('lets a valid explicit protocol decide, as Better Auth does', () => {
		expect(resolveSecureCookies('http', 'https://app.example.com')).toBe(undefined);
		expect(resolveSecureCookies('https', 'http://localhost:5173')).toBe(undefined);
		expect(resolveSecureCookies('auto', 'https://app.example.com')).toBe(undefined);
	});

	it('ignores an invalid explicit protocol', () => {
		expect(resolveSecureCookies('HTTPS', 'https://app.example.com')).toBe(true);
		expect(resolveSecureCookies('', 'http://localhost:5173')).toBe(undefined);
	});
});

describe('Better Auth with an https fallback URL and no explicit protocol', () => {
	const fallback = 'https://app.example.com';

	it('gives the session cookie the __Secure- prefix', () => {
		const baseURL = { allowedHosts: ['app.example.com'], fallback };
		const createCookie = createCookieGetter({
			baseURL,
			advanced: { useSecureCookies: resolveSecureCookies(undefined, fallback) }
		});
		expect(createCookie('session_token').name).toBe('__Secure-better-auth.session_token');
		expect(createCookie('session_token').attributes.secure).toBe(true);
		// Without the option, Better Auth falls back to NODE_ENV, which is not production here
		expect(createCookieGetter({ baseURL })('session_token').name).toBe('better-auth.session_token');
	});

	it('keeps the URL protocol per request, so http localhost next to it stays http', () => {
		process.env.BETTER_AUTH_ALLOWED_HOSTS = 'app.example.com,localhost:5173';
		process.env.BETTER_AUTH_FALLBACK_URL = fallback;
		delete process.env.BETTER_AUTH_BASE_URL_PROTOCOL;
		expect(getBetterAuthBaseUrl()).not.toHaveProperty('protocol');
	});
});
