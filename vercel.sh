#!/bin/bash
set -e

ln -sfn "$(pwd)/node_modules" ../shared/node_modules

# The nextjs and svelte apps build as two Vercel projects from the same branch. Named by the
# branch alone, both pushed to one Convex preview deployment at the same time, and a branch's
# first build could fail with "RaceDetected: Component betterAuth was created by a concurrent
# push". Each app's preview gets its own backend instead.
if [ "$VERCEL_ENV" = "preview" ]; then
	pnpm exec convex deploy --cmd='pnpm build' --preview-name "${VERCEL_GIT_COMMIT_REF}-$(basename "$(pwd)")"
else
	pnpm exec convex deploy --cmd='pnpm build'
fi
