// Prints the public origin of a preview build, or nothing when the build can't know it.
//
// vercel.sh and cloudflare.sh set it as the preview backend's BETTER_AUTH_FALLBACK_URL. With
// @convex-dev/better-auth 0.13, Better Auth builds its links and OAuth callbacks on the browser's
// origin only when that origin is trusted exactly: a host in BETTER_AUTH_ALLOWED_HOSTS without a
// wildcard, or the fallback URL's origin. A preview matched only by a wildcard got the Convex
// deployment's own `.convex.site` URL there instead.
//
//   node scripts/preview-origin.mjs vercel
//   node scripts/preview-origin.mjs cloudflare <worker name>
import { createHash } from 'node:crypto';

const MAX_DNS_LABEL_LENGTH = 63;
const HASH_LENGTH = 4;

/**
 * The Preview alias Cloudflare gives a branch, as Wrangler derives it (`sanitizeBranchName` and
 * `generatePreviewAlias`): every character outside `[a-zA-Z0-9-]` becomes `-`, runs of `-`
 * collapse, leading and trailing `-` go, lower case. An alias too long for one DNS label together
 * with `-<worker>` keeps its start and ends in `-` and four hex digits of the branch's SHA-256.
 */
export function previewAlias(branch, workerName) {
	const sanitized = branch
		.replace(/[^a-zA-Z0-9-]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase();
	const available = MAX_DNS_LABEL_LENGTH - workerName.length - 1;
	if (sanitized.length <= available) return sanitized;
	const suffix = `-${createHash('sha256').update(branch).digest('hex').slice(0, HASH_LENGTH)}`;
	return `${sanitized.slice(0, available - suffix.length)}${suffix}`;
}

export function previewOrigin(platform, env, workerName) {
	if (platform === 'vercel') {
		// The branch URL stays the same for every deployment of the branch.
		const host = env.VERCEL_BRANCH_URL?.trim();
		return host ? `https://${host}` : null;
	}
	if (platform === 'cloudflare') {
		const branch = env.WORKERS_CI_BRANCH?.trim();
		const subdomain = env.WORKERS_SUBDOMAIN?.trim();
		if (!branch || !subdomain || !workerName) return null;
		return `https://${previewAlias(branch, workerName)}-${workerName}.${subdomain}`;
	}
	throw new Error(`Unknown platform '${platform}', expected vercel or cloudflare`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const [platform, workerName] = process.argv.slice(2);
	const origin = previewOrigin(platform, process.env, workerName);
	if (origin) console.log(origin);
}
