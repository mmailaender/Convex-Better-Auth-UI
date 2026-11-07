#!/bin/sh
# Build command of the Cloudflare Workers Builds projects `convex-better-auth-ui-nextjs` (root `/nextjs`)
# and `convex-better-auth-ui-svelte` (root `/svelte`): `sh ../cloudflare.sh`, the twin of vercel.sh.
# Workers Builds deploys the output afterwards (`vinext-cloudflare` for Next.js, `wrangler` for SvelteKit).
set -eu

fail() {
	echo "cloudflare.sh: $1" >&2
	exit 1
}

require() {
	for name in "$@"; do
		eval "value=\${$name:-}"
		[ -n "$value" ] || fail "$name is not set. Set it in the Cloudflare project's build variables."
	done
}

app="$(basename "$(pwd)")"
case "$app" in
nextjs)
	# vinext builds the Next.js app for Workers.
	build='pnpm build:vinext'
	# The Worker's name, as nextjs/cloudflare.config.ts declares it
	worker='convex-better-auth-ui-nextjs'
	url_vars='NEXT_PUBLIC_CONVEX_URL NEXT_PUBLIC_CONVEX_SITE_URL'
	;;
svelte)
	# WORKERS_CI selects @sveltejs/adapter-cloudflare in vite.config.ts.
	build='pnpm build'
	url_vars='PUBLIC_CONVEX_URL PUBLIC_CONVEX_SITE_URL'
	# The Worker's name, as svelte/wrangler.jsonc declares it
	worker='convex-better-auth-ui-svelte'
	;;
*) fail "run it from nextjs/ or svelte/, not $app/" ;;
esac

require WORKERS_CI WORKERS_CI_BRANCH

ln -sfn "$(pwd)/node_modules" ../shared/node_modules

if [ "$WORKERS_CI_BRANCH" = "main" ]; then
	# Production builds against the production backend its build variables name. Vercel's production
	# build stays the only deployer of that backend.
	# shellcheck disable=SC2086 # url_vars is a list of names
	require $url_vars
	$build
else
	# Each app's preview on each platform gets its own Convex preview deployment, so no two builds of
	# a branch push to one backend at once (see vercel.sh). Convex accepts `/` in a preview name.
	require CONVEX_DEPLOY_KEY
	# vinext writes Preview build output only with this set, and `vinext-cloudflare previews deploy`
	# refuses any other output.
	export CLOUDFLARE_PREVIEW_BUILD=true
	preview_name="${WORKERS_CI_BRANCH}-${app}-cf"
	pnpm exec convex deploy --cmd="$build" --preview-name "$preview_name"
	# Better Auth builds links and OAuth callbacks on the preview's own origin only when it is the
	# fallback URL (scripts/preview-origin.mjs). WORKERS_SUBDOMAIN is the account's workers.dev
	# subdomain, for example `acme.workers.dev`.
	origin="$(node ../scripts/preview-origin.mjs cloudflare "$worker")"
	if [ -n "$origin" ]; then
		pnpm exec convex env set BETTER_AUTH_FALLBACK_URL "$origin" --preview-name "$preview_name"
	else
		echo "cloudflare.sh: WORKERS_SUBDOMAIN is not set, so the preview backend keeps its default BETTER_AUTH_FALLBACK_URL" >&2
	fi
fi
