/**
 * Returns `target` as a path on `origin` (query and hash kept), else `fallback`.
 * Only the app's own site is a redirect target: a `redirectTo` taken from a link must
 * never send a person who has just signed in to another host. The path check catches
 * values the URL API resolves to `//host` on our origin, such as `/..//host`.
 */
export function safeRedirect(
	target: string | null | undefined,
	fallback = '/',
	origin = location.origin
): string {
	if (!target) return fallback;
	try {
		const url = new URL(target, origin);
		const path = url.pathname + url.search + url.hash;
		return url.origin === origin && !path.startsWith('//') ? path : fallback;
	} catch {
		return fallback;
	}
}
