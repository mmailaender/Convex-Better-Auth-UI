import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const goto = vi.hoisted(() => vi.fn());
vi.mock('$app/navigation', () => ({ goto }));

import { appHref, gotoApp } from './navigation';

const assign = vi.fn();

beforeEach(() => {
	vi.stubGlobal('location', new URL('https://example.com/base/typo'));
	vi.stubGlobal('window', { location: { assign } });
});

afterEach(() => {
	vi.unstubAllGlobals();
	goto.mockReset();
	assign.mockReset();
});

describe('appHref', () => {
	it('keeps the base path, query and hash as they are', () => {
		const url = new URL('https://example.com/base/acme/settings?filter[status]=open#a//b');
		expect(appHref(url)).toBe('/base/acme/settings?filter[status]=open#a//b');
	});

	it('accepts a same-origin path', () => {
		expect(appHref('/base/acme?dialog=user-profile')).toBe('/base/acme?dialog=user-profile');
	});
});

describe('gotoApp', () => {
	it('navigates client-side when the URL matches a route', async () => {
		goto.mockResolvedValue(undefined);
		await gotoApp('/base/acme?dialog=user-profile', { replace: true });
		expect(goto).toHaveBeenCalledWith('/base/acme?dialog=user-profile', { replace: true });
		expect(assign).not.toHaveBeenCalled();
	});

	it('falls back to a full page load when goto rejects the URL', async () => {
		goto.mockRejectedValue(new Error('navigation_route_missing'));
		await gotoApp('/base/typo?dialog=user-profile');
		expect(assign).toHaveBeenCalledWith('/base/typo?dialog=user-profile');
	});
});
