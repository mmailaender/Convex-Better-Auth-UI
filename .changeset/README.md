# Changesets

Releases of the `@auth/svelte` and `@auth/nextjs` jsrepo registries are driven by [changesets](https://github.com/changesets/changesets).

1. In a PR that changes a registry, run `pnpm changeset` from the repo root and pick the registry (or both) and the bump type.
2. When the PR lands on `main`, the Release workflow opens (or updates) a `chore: version packages` PR that bumps `svelte/package.json` / `nextjs/package.json` and writes the CHANGELOG entries.
3. Merging that PR publishes every registry whose version isn't on jsrepo.com yet, tags it as `@auth/<framework>@<version>` and creates a GitHub release.

Changeset descriptions end up verbatim in the CHANGELOG. A release has one upgrade entry per registry, `0-upgrade-nextjs.md` and `0-upgrade-svelte.md` (the `0-` sorts it first), with the `#### Migration` steps and the one `jsrepo update ...` command for everything in the release. When your change needs users to act or touches another registry item, add its steps and items there (create the file if the release doesn't have one yet) instead of a command in your own changeset.
