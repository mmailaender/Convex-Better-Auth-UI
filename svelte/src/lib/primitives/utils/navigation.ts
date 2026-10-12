import { goto } from '$app/navigation';
import type { ResolvedPathname } from '$app/types';

type GotoOptions = Parameters<typeof goto>[1];

/**
 * Path, query and hash of a URL inside the app, such as a copy of `page.url`.
 * Don't pass these through `resolve()`: they already carry the base path, and `resolve()` reads a
 * leading `/` as a route ID (so `[` in the query throws and `//` in the hash collapses).
 */
export function appHref(url: URL | string): ResolvedPathname {
	const { pathname, search, hash } = typeof url === 'string' ? new URL(url, location.origin) : url;
	return `${pathname}${search}${hash}` as ResolvedPathname;
}

/**
 * `goto()` for a URL inside the app. SvelteKit 3 rejects URLs that match no route, which includes
 * the current URL while the error page is showing; fall back to a full page load like SvelteKit 2.
 */
export async function gotoApp(url: URL | string, options?: GotoOptions): Promise<void> {
	const href = appHref(url);
	// eslint-disable-next-line svelte/no-navigation-without-resolve -- href is an app URL that already includes the base path
	await goto(href, options).catch(() => window.location.assign(href));
}
