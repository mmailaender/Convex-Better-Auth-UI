import type { BetterAuthOptions } from 'better-auth';

type BaseUrlProtocol = 'http' | 'https' | 'auto';

const MISSING_ALLOWED_HOST_SENTINEL = 'better-auth-config.invalid';

/**
 * Parse the comma-separated Better Auth host allowlist from env.
 */
export const parseAllowedHosts = (value?: string) =>
	(value ?? '')
		.split(',')
		.map((host) => host.trim())
		.filter(Boolean);

const getConfiguredAllowedHosts = () => parseAllowedHosts(process.env.BETTER_AUTH_ALLOWED_HOSTS);

/**
 * Whether the app has an explicit Better Auth host allowlist configured.
 */
export const hasConfiguredAllowedHosts = () => getConfiguredAllowedHosts().length > 0;

/**
 * Fail loudly when the app-facing Better Auth hosts are missing.
 */
export const assertConfiguredAllowedHosts = () => {
	if (!hasConfiguredAllowedHosts()) {
		throw new Error('BETTER_AUTH_ALLOWED_HOSTS must be set to at least one trusted host.');
	}
};

const getConvexSiteHost = () => {
	const siteUrl = process.env.CONVEX_SITE_URL;
	if (!siteUrl) return undefined;

	try {
		return new URL(siteUrl).host;
	} catch {
		return undefined;
	}
};

const withConvexSiteHost = (hosts: string[]) => {
	const convexSiteHost = getConvexSiteHost();
	return [...new Set([...hosts, ...(convexSiteHost ? [convexSiteHost] : [])])];
};

/**
 * Full Better Auth allowlist used at runtime.
 *
 * This always includes the Convex site host so Convex-specific OIDC/JWKS
 * endpoints keep working on `CONVEX_SITE_URL`. When the app-facing host
 * allowlist is missing, we return a sentinel value instead of throwing so
 * Convex static analysis can still initialize modules. Real request-sensitive
 * flows call `assertConfiguredAllowedHosts()` and fail clearly.
 */
export const getAllowedHosts = () => {
	const configuredHosts = getConfiguredAllowedHosts();
	const baseHosts = configuredHosts.length > 0 ? configuredHosts : [MISSING_ALLOWED_HOST_SENTINEL];

	return withConvexSiteHost(baseHosts);
};

/**
 * Parse Better Auth's optional protocol override.
 */
export const parseBaseUrlProtocol = (value?: string): BaseUrlProtocol | undefined => {
	switch (value) {
		case 'http':
		case 'https':
		case 'auto':
			return value;
		default:
			return undefined;
	}
};

/**
 * Resolve the protocol Better Auth uses with the dynamic baseURL.
 *
 * A valid explicit value (`http`, `https` or `auto`) wins. Otherwise the
 * protocol of the fallback URL applies. With a dynamic baseURL, Better Auth
 * decides once at startup whether cookies get the `__Secure-` prefix and the
 * `Secure` attribute, and without a protocol it decides by
 * `NODE_ENV === 'production'`, which is false on Convex deployments. Taking
 * the protocol from an https fallback URL keeps cookies Secure there.
 */
export const resolveBaseUrlProtocol = (
	explicit?: string,
	fallbackUrl?: string
): BaseUrlProtocol | undefined => {
	const explicitProtocol = parseBaseUrlProtocol(explicit);
	if (explicitProtocol) return explicitProtocol;
	if (!fallbackUrl) return undefined;

	// Only https is taken over. An http fallback (local development, or previews whose shared
	// defaults point at localhost) leaves the protocol to each request, as before: forcing http
	// would make Better Auth build http URLs for HTTPS hosts and trust only their http origins.
	try {
		return new URL(fallbackUrl).protocol === 'https:' ? 'https' : undefined;
	} catch {
		return undefined;
	}
};

export const getBaseUrlProtocol = () =>
	resolveBaseUrlProtocol(
		process.env.BETTER_AUTH_BASE_URL_PROTOCOL,
		process.env.BETTER_AUTH_FALLBACK_URL
	);

/**
 * Better Auth baseURL config for dynamic host resolution.
 *
 * The `fallback` URL is used when no incoming request is available to derive
 * a host (e.g. Convex mutations, cron jobs, CLI tools). Without it,
 * server-side `auth.api.*` calls that lack request context would fail with
 * "Invalid URL: ''".
 */
export const getBetterAuthBaseUrl = (): BetterAuthOptions['baseURL'] => {
	const allowedHosts = getAllowedHosts();
	const protocol = getBaseUrlProtocol();
	const fallback = process.env.BETTER_AUTH_FALLBACK_URL;

	return {
		allowedHosts,
		...(protocol && { protocol }),
		...(fallback && { fallback })
	};
};

/**
 * Canonical app URL for Better Auth flows that run without request context.
 */
export const getBetterAuthFallbackUrl = () => process.env.BETTER_AUTH_FALLBACK_URL;

const matchesHostPattern = (host: string, pattern: string) => {
	const matcher = new RegExp(
		`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`,
		'i'
	);

	return matcher.test(host);
};

/**
 * Whether a concrete host is trusted by the Better Auth allowlist.
 */
export const isAllowedHost = (host: string) =>
	getAllowedHosts().some((pattern) => matchesHostPattern(host, pattern));

const getRequestHost = (request: Request) => {
	const forwardedHost = request.headers.get('x-forwarded-host');
	return forwardedHost ?? new URL(request.url).host;
};

const resolveRequestProtocol = (request: Request) => {
	const configuredProtocol = getBaseUrlProtocol();
	if (configuredProtocol && configuredProtocol !== 'auto') {
		return configuredProtocol;
	}

	return (
		request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(/:$/, '')
	);
};

/**
 * Resolve the externally trusted origin for a request, if available.
 */
export const resolveRequestBaseUrl = (request?: Request) => {
	assertConfiguredAllowedHosts();
	if (!request) return undefined;

	const host = getRequestHost(request);
	if (!host || !isAllowedHost(host)) return undefined;

	return `${resolveRequestProtocol(request)}://${host}`;
};

/**
 * Validate an app-provided origin before using it in redirects.
 */
export const assertAllowedOrigin = (origin: string) => {
	assertConfiguredAllowedHosts();

	const url = new URL(origin);

	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new Error(`Unsupported success origin protocol: ${url.protocol}`);
	}

	if (!isAllowedHost(url.host)) {
		throw new Error(`Untrusted success origin host: ${url.host}`);
	}

	return url.origin;
};
