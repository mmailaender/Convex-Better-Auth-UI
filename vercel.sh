#!/bin/bash
set -e

ln -sfn "$(pwd)/node_modules" ../shared/node_modules

app="$(basename "$(pwd)")"

# The nextjs and svelte apps build as two Vercel projects from the same branch. Named by the
# branch alone, both pushed to one Convex preview deployment at the same time, and a branch's
# first build could fail with "RaceDetected: Component betterAuth was created by a concurrent
# push". Each app's preview gets its own backend instead.
if [ "$VERCEL_ENV" = "preview" ]; then
	pnpm exec convex deploy --cmd='pnpm build' --preview-name "${VERCEL_GIT_COMMIT_REF}-${app}"
# Production has one backend, so one project deploys it: auth-svelte. The others build against it.
elif [ "$app" = "svelte" ]; then
	pnpm exec convex deploy --cmd='pnpm build'
else
	: "${NEXT_PUBLIC_CONVEX_URL:?Set NEXT_PUBLIC_CONVEX_URL to the production backend in the Production environment of the auth-nextjs project}"
	: "${NEXT_PUBLIC_CONVEX_SITE_URL:?Set NEXT_PUBLIC_CONVEX_SITE_URL to the production backend in the Production environment of the auth-nextjs project}"
	pnpm build
fi
