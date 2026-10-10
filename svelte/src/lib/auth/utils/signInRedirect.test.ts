import { afterEach, describe, expect, it, vi } from 'vitest';
import { goto } from '$app/navigation';
import {
	gotoSameOriginPath,
	resolveSignInCallbackURL,
	resolveSignInRedirect,
	sameOriginPath
} from './signInRedirect';

vi.mock('$app/navigation', () => ({ goto: vi.fn(async () => undefined) }));

const ORIGIN = 'https://app.example';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('sameOriginPath', () => {
	it('keeps a same-origin path with its query and hash', () => {
		expect(sameOriginPath('/settings?tab=2&q=a#members', ORIGIN)).toBe(
			'/settings?tab=2&q=a#members'
		);
	});

	it.each([
		['an empty value', ''],
		['a missing value', null],
		['a full URL to another host', 'https://attacker.example/signin'],
		['a full URL to our own origin', 'https://app.example/settings'],
		['a protocol-relative URL', '//attacker.example'],
		['a backslash URL', '/\\attacker.example'],
		['a tab that turns into a protocol-relative URL', '/\t/attacker.example'],
		['a dot segment that resolves to a protocol-relative path', '/..//attacker.example'],
		['a nested dot segment', '/settings/..//attacker.example/x?y#z'],
		['an encoded protocol-relative URL', '%2F%2Fattacker.example'],
		['an encoded full URL', 'https%3A%2F%2Fattacker.example'],
		['a relative path', 'settings'],
		['leading whitespace', ' //attacker.example'],
		['a javascript: URL', 'javascript:alert(document.domain)'],
		['a data: URL', 'data:text/html,<script>alert(1)</script>']
	])('rejects %s', (_label, target) => {
		expect(sameOriginPath(target, ORIGIN)).toBeUndefined();
	});

	it('keeps an encoded slash inside a path, which a browser never reads as a host', () => {
		expect(sameOriginPath('/%2F%2Fattacker.example', ORIGIN)).toBe('/%2F%2Fattacker.example');
	});
});

describe('resolveSignInRedirect', () => {
	it('uses the component destination first', () => {
		expect(
			resolveSignInRedirect('/checkout', new URL(`${ORIGIN}/signin?redirectTo=%2Fsettings`))
		).toBe('/checkout');
	});

	it('uses the redirectTo query next', () => {
		expect(
			resolveSignInRedirect(undefined, new URL(`${ORIGIN}/signin?redirectTo=%2Fsettings%3Ftab%3D2`))
		).toBe('/settings?tab=2');
	});

	it('goes home from the sign-in page without a destination', () => {
		expect(resolveSignInRedirect(undefined, new URL(`${ORIGIN}/signin`))).toBe('/');
	});

	it('has no destination on another page without one', () => {
		expect(resolveSignInRedirect(undefined, new URL(`${ORIGIN}/settings`))).toBeUndefined();
	});

	it.each([
		'https%3A%2F%2Fattacker.example',
		'%2F%2Fattacker.example',
		'%2F%5Cattacker.example',
		'%252F%252Fattacker.example',
		'javascript%3Aalert(1)',
		''
	])('falls back home for /signin?redirectTo=%s', (encoded) => {
		expect(
			resolveSignInRedirect(undefined, new URL(`${ORIGIN}/signin?redirectTo=${encoded}`))
		).toBe('/');
	});

	it('falls back to the query destination when the component destination is foreign', () => {
		expect(
			resolveSignInRedirect(
				'https://attacker.example',
				new URL(`${ORIGIN}/signin?redirectTo=%2Fsettings`)
			)
		).toBe('/settings');
	});
});

describe('resolveSignInCallbackURL', () => {
	it('is the destination as an absolute URL on the current origin', () => {
		expect(
			resolveSignInCallbackURL(undefined, new URL(`${ORIGIN}/signin?redirectTo=%2Fsettings`))
		).toBe(`${ORIGIN}/settings`);
	});

	it('is home on the current origin when the destination is foreign', () => {
		expect(
			resolveSignInCallbackURL(
				undefined,
				new URL(`${ORIGIN}/settings?redirectTo=%2F%2Fattacker.example`)
			)
		).toBe(`${ORIGIN}/`);
	});
});

/** Characters SvelteKit's resolve() reads as route syntax, and Better Auth rejects in a relative callback. */
const ROUTE_SYNTAX_PATH = '/settings?name=[draft]#one//two';

describe('a destination with brackets in its query and // in its hash', () => {
	it('survives validation unchanged', () => {
		expect(sameOriginPath(ROUTE_SYNTAX_PATH, ORIGIN)).toBe(ROUTE_SYNTAX_PATH);
		expect(
			resolveSignInRedirect(
				undefined,
				new URL(`${ORIGIN}/signin?redirectTo=${encodeURIComponent(ROUTE_SYNTAX_PATH)}`)
			)
		).toBe(ROUTE_SYNTAX_PATH);
	});

	it('becomes an absolute callback URL for Better Auth', () => {
		expect(resolveSignInCallbackURL(ROUTE_SYNTAX_PATH, new URL(`${ORIGIN}/signin`))).toBe(
			`${ORIGIN}${ROUTE_SYNTAX_PATH}`
		);
	});

	it('is navigated to exactly as given', async () => {
		vi.stubGlobal('window', { location: { origin: ORIGIN } });
		await gotoSameOriginPath(ROUTE_SYNTAX_PATH, { invalidateAll: true });
		expect(goto).toHaveBeenLastCalledWith(ROUTE_SYNTAX_PATH, { invalidateAll: true });
	});
});

describe('gotoSameOriginPath', () => {
	it.each(['https://attacker.example/signin', '//attacker.example', '/..//attacker.example'])(
		'sends a foreign target passed directly (%s) to the fallback',
		async (target) => {
			vi.stubGlobal('window', { location: { origin: ORIGIN } });
			await gotoSameOriginPath(target);
			expect(goto).toHaveBeenLastCalledWith('/', undefined);
			await gotoSameOriginPath(target, undefined, '/settings');
			expect(goto).toHaveBeenLastCalledWith('/settings', undefined);
		}
	);
});
