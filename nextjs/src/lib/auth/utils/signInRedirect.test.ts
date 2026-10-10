import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
	pushSameOriginPath,
	resolveSignInCallbackURL,
	resolveSignInRedirect,
	sameOriginPath
} from './signInRedirect.ts';

const ORIGIN = 'https://app.example';

describe('sameOriginPath', () => {
	it('keeps a same-origin path with its query and hash', () => {
		assert.equal(
			sameOriginPath('/settings?tab=2&q=a#members', ORIGIN),
			'/settings?tab=2&q=a#members'
		);
	});

	for (const [label, target] of [
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
	] as const) {
		it(`rejects ${label}`, () => {
			assert.equal(sameOriginPath(target, ORIGIN), undefined);
		});
	}

	it('keeps an encoded slash inside a path, which a browser never reads as a host', () => {
		assert.equal(sameOriginPath('/%2F%2Fattacker.example', ORIGIN), '/%2F%2Fattacker.example');
	});
});

describe('resolveSignInRedirect', () => {
	it('uses the component destination first', () => {
		assert.equal(
			resolveSignInRedirect('/checkout', new URL(`${ORIGIN}/signin?redirectTo=%2Fsettings`)),
			'/checkout'
		);
	});

	it('uses the redirectTo query next', () => {
		assert.equal(
			resolveSignInRedirect(
				undefined,
				new URL(`${ORIGIN}/signin?redirectTo=%2Fsettings%3Ftab%3D2`)
			),
			'/settings?tab=2'
		);
	});

	it('goes home from the sign-in page without a destination', () => {
		assert.equal(resolveSignInRedirect(undefined, new URL(`${ORIGIN}/signin`)), '/');
	});

	it('has no destination on another page without one', () => {
		assert.equal(resolveSignInRedirect(undefined, new URL(`${ORIGIN}/settings`)), undefined);
	});

	for (const encoded of [
		'https%3A%2F%2Fattacker.example',
		'%2F%2Fattacker.example',
		'%2F%5Cattacker.example',
		'%252F%252Fattacker.example',
		'javascript%3Aalert(1)',
		''
	]) {
		it(`falls back home for /signin?redirectTo=${encoded}`, () => {
			assert.equal(
				resolveSignInRedirect(undefined, new URL(`${ORIGIN}/signin?redirectTo=${encoded}`)),
				'/'
			);
		});
	}

	it('falls back to the query destination when the component destination is foreign', () => {
		assert.equal(
			resolveSignInRedirect(
				'https://attacker.example',
				new URL(`${ORIGIN}/signin?redirectTo=%2Fsettings`)
			),
			'/settings'
		);
	});
});

describe('resolveSignInCallbackURL', () => {
	it('is the destination as an absolute URL on the current origin', () => {
		assert.equal(
			resolveSignInCallbackURL(undefined, new URL(`${ORIGIN}/signin?redirectTo=%2Fsettings`)),
			`${ORIGIN}/settings`
		);
	});

	it('is home on the current origin when the destination is foreign', () => {
		assert.equal(
			resolveSignInCallbackURL(
				undefined,
				new URL(`${ORIGIN}/settings?redirectTo=%2F%2Fattacker.example`)
			),
			`${ORIGIN}/`
		);
	});

	it('keeps brackets in the query and // in the hash, which Better Auth rejects in a relative callback', () => {
		const path = '/settings?name=[draft]#one//two';
		assert.equal(resolveSignInCallbackURL(path, new URL(`${ORIGIN}/signin`)), `${ORIGIN}${path}`);
	});
});

describe('pushSameOriginPath', () => {
	const originalWindow = globalThis.window;
	afterEach(() => {
		globalThis.window = originalWindow;
	});

	function recordingRouter() {
		const pushed: string[] = [];
		return { pushed, router: { push: (href: string) => void pushed.push(href) } };
	}

	it('pushes a same-origin path exactly as given', () => {
		globalThis.window = { location: { origin: ORIGIN } } as Window & typeof globalThis;
		const { pushed, router } = recordingRouter();
		pushSameOriginPath(router, '/settings?name=[draft]#one//two');
		assert.deepEqual(pushed, ['/settings?name=[draft]#one//two']);
	});

	for (const target of [
		'https://attacker.example/signin',
		'//attacker.example',
		'/..//attacker.example'
	]) {
		it(`sends a foreign target passed directly (${target}) to the fallback`, () => {
			globalThis.window = { location: { origin: ORIGIN } } as Window & typeof globalThis;
			const { pushed, router } = recordingRouter();
			pushSameOriginPath(router, target);
			pushSameOriginPath(router, target, '/settings');
			assert.deepEqual(pushed, ['/', '/settings']);
		});
	}
});
