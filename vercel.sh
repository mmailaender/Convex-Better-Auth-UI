#!/bin/bash
set -e

ln -sfn "$(pwd)/node_modules" ../shared/node_modules

app="$(basename "$(pwd)")"

# Deploy only for the two environments Vercel builds in. Anything else, such as VERCEL_ENV missing
# because system variables are not exposed, would otherwise fall through to a production deploy.
case "${VERCEL_ENV:-}" in
preview | production) ;;
*)
	echo "vercel.sh: unsupported VERCEL_ENV '${VERCEL_ENV:-}', expected preview or production" >&2
	exit 1
	;;
esac

# The nextjs and svelte apps build as two Vercel projects from the same branch. Named by the
# branch alone, both pushed to one Convex preview deployment at the same time, and a branch's
# first build could fail with "RaceDetected: Component betterAuth was created by a concurrent
# push". Each app's preview gets its own backend instead.
if [ "$VERCEL_ENV" = "preview" ]; then
	preview_name="${VERCEL_GIT_COMMIT_REF}-${app}"
	pnpm exec convex deploy --cmd='pnpm build' --preview-name "$preview_name"
	# Better Auth builds links and OAuth callbacks on the preview's own origin only when it is the
	# fallback URL (scripts/preview-origin.mjs). Vercel's branch URL is the one that stays put.
	origin="$(node ../scripts/preview-origin.mjs vercel)"
	if [ -n "$origin" ]; then
		pnpm exec convex env set BETTER_AUTH_FALLBACK_URL "$origin" --preview-name "$preview_name"
	else
		echo "vercel.sh: VERCEL_BRANCH_URL is not set, so the preview backend keeps its default BETTER_AUTH_FALLBACK_URL" >&2
	fi
# Production has one backend, so one project deploys it: auth-svelte. The others build against it.
elif [ "$app" = "svelte" ]; then
	pnpm exec convex deploy --cmd='pnpm build'
else
	: "${NEXT_PUBLIC_CONVEX_URL:?Set NEXT_PUBLIC_CONVEX_URL to the production backend in the Production environment of the auth-nextjs project}"
	: "${NEXT_PUBLIC_CONVEX_SITE_URL:?Set NEXT_PUBLIC_CONVEX_SITE_URL to the production backend in the Production environment of the auth-nextjs project}"
	pnpm build
fi
