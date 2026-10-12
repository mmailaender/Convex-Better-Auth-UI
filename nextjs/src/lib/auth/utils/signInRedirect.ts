export function resolveSignInRedirect(
	redirectParam: string | undefined,
	currentURL: URL
): string | undefined {
	if (redirectParam) return redirectParam;

	const redirectTo = currentURL.searchParams.get('redirectTo');
	if (redirectTo) return redirectTo;

	if (currentURL.pathname === '/signin') return '/';
}

export function resolveSignInCallbackURL(
	redirectParam: string | undefined,
	currentURL: URL
): string {
	return (
		resolveSignInRedirect(redirectParam, currentURL) ??
		`${currentURL.pathname}${currentURL.search}${currentURL.hash}`
	);
}
