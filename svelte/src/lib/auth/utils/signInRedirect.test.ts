import { describe, expect, it } from 'vitest';
import { resolveSignInCallbackURL, resolveSignInRedirect } from './signInRedirect';

describe('resolveSignInRedirect', () => {
	it('uses an explicit component destination first', () => {
		expect(resolveSignInRedirect('/checkout', new URL('https://example.com/signin'))).toBe(
			'/checkout'
		);
	});

	it('uses the standalone sign-in query destination', () => {
		expect(
			resolveSignInRedirect(
				undefined,
				new URL('https://example.com/signin?redirectTo=%2Fdashboard')
			)
		).toBe('/dashboard');
	});

	it('returns home from standalone sign-in without a destination', () => {
		expect(resolveSignInRedirect(undefined, new URL('https://example.com/signin'))).toBe('/');
	});

	it('does not navigate after embedded sign-in completes in place', () => {
		expect(
			resolveSignInRedirect(
				undefined,
				new URL('https://example.com/themes/new?probe=return#editor')
			)
		).toBeUndefined();
	});
});

describe('resolveSignInCallbackURL', () => {
	it('returns the current page for an embedded flow', () => {
		expect(
			resolveSignInCallbackURL(
				undefined,
				new URL('https://example.com/themes/new?probe=return#editor')
			)
		).toBe('/themes/new?probe=return#editor');
	});

	it('keeps an explicit destination authoritative', () => {
		expect(
			resolveSignInCallbackURL(
				'/checkout',
				new URL('https://example.com/themes/new?probe=return#editor')
			)
		).toBe('/checkout');
	});
});
