import { goto } from '$app/navigation';

/**
 * Returns `target` as a path on `origin` (query and hash kept), or `undefined` when it
 * points anywhere else. Only the app's own site is a redirect target: a `redirectTo` or
 * callback URL taken from a link must never send a person who has just signed in to
 * another host.
 *
 * The value must start with a single `/`; the URL API then resolves it, and both the
 * origin and the resolved path are checked, because the URL API turns a backslash, a tab
 * or a dot segment (`/..//host`) into another host or a protocol-relative `//host`.
 */
export function sameOriginPath(
	target: string | null | undefined,
	origin: string
): string | undefined {
	if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
		return undefined;
	}

	let resolved: URL;
	try {
		resolved = new URL(target, origin);
	} catch {
		return undefined;
	}
	if (resolved.origin !== new URL(origin).origin || resolved.pathname.startsWith('//')) {
		return undefined;
	}

	return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}

/**
 * The destination after sign-in: the component's `redirectTo`, else the page's
 * `redirectTo` query, else home on a sign-in page. A value that is not a same-origin
 * path counts as absent.
 */
export function resolveSignInRedirect(
	redirectParam: string | undefined,
	currentURL: URL
): string | undefined {
	const redirectTo =
		sameOriginPath(redirectParam, currentURL.origin) ??
		sameOriginPath(currentURL.searchParams.get('redirectTo'), currentURL.origin);
	if (redirectTo) return redirectTo;

	if (currentURL.pathname.includes('/signin')) return '/';
}

/**
 * The `callbackURL` for a Better Auth flow that leaves the page (email verification,
 * magic link, social sign-in): the sign-in destination, else home, as an absolute URL on
 * the current origin. Better Auth accepts a relative callback only without `#`, brackets
 * and similar characters (403 INVALID_CALLBACK_URL); an absolute one is checked against
 * its trusted origins instead.
 */
export function resolveSignInCallbackURL(
	redirectParam: string | undefined,
	currentURL: URL
): string {
	return `${currentURL.origin}${resolveSignInRedirect(redirectParam, currentURL) ?? '/'}`;
}

/**
 * Navigates to `path` when it is a same-origin path, else to `fallback` (home), checking
 * it again with `sameOriginPath` so this navigation is safe whatever a caller passes.
 * The path is used exactly as validated: SvelteKit's `resolve()` would read `[name]`
 * anywhere in it as a route parameter (and throw) and drop empty segments, so a query
 * such as `?name=[draft]` or a hash such as `#one//two` would not survive it.
 */
export function gotoSameOriginPath(
	path: string,
	options?: Parameters<typeof goto>[1],
	fallback = '/'
): Promise<void> {
	const target = sameOriginPath(path, window.location.origin) ?? fallback;
	// eslint-disable-next-line svelte/no-navigation-without-resolve -- target passed sameOriginPath just above; resolve() would mangle its query and hash (see above)
	return goto(target, options);
}
