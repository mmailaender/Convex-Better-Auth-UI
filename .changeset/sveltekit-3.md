---
'@auth/svelte': minor
---

**BREAKING:** Migrate to SvelteKit 3. Components now import library and Convex code through the `#lib` and `#convex` subpath imports instead of the `$lib` and `$convex` aliases, the `base` item ships a `vite.config.ts` (SvelteKit 3 no longer reads `svelte.config.js`), declares the Convex URLs in `src/env.ts` (SvelteKit 3 only exposes environment variables declared there) and registers the Convex URL with `initConvex()` in a new `src/hooks.ts`, the auth route passes `PUBLIC_CONVEX_SITE_URL` to `createSvelteKitHandler()` explicitly, and navigation uses the SvelteKit 3 `goto` options (`replace`, `reset`, `refreshAll`). The registry's default `lib` path is now `./src/lib`.

chore: Upgrade `@mmailaender/convex-better-auth-svelte` to 0.10.0 and `convex-svelte` to 0.15.1 (both support SvelteKit 3; the auth client no longer opens a WebSocket during server rendering), `@ark-ui/svelte` to 5.24, `@lucide/svelte` to 1.x, `svelte-sonner` to 1.2, `@zxcvbn-ts/core` to 4.2, Vite to 8.3, Vitest to 5 and the lint/format tooling; drop the unused `vaul-svelte`, `mode-watcher` and `@internationalized/date`

fix: Same-page URL updates (opening and closing the profile dialogs, swapping the organization slug, post-sign-in redirects) go through a new `primitives/utils/navigation` helper instead of `resolve()`. `resolve()` treats a path with a leading `/` as a route ID, so the base path was applied twice and a `[` in the query threw. When the current URL matches no route, as on the error page, the helper falls back to a full page load. Without it, SvelteKit 3's `goto` rejects and the user and organization dialogs wouldn't open on a 404 page.

chore: Upgrade Convex to 1.46, `@convex-dev/better-auth` to 0.12.5, `@convex-dev/resend` to 0.2.9, `@convex-dev/migrations` to 0.3.7 and `convex-helpers` to 0.1.128; `updateUser` now uses the validator's built-in `.partial()` instead of the deprecated `convex-helpers` helper

chore: Upgrade `@icons-pack/svelte-simple-icons` to 7 and import icons individually (faster builds); Slack and Salesforce, which Simple Icons removed in v16, now ship as local `primitives/ui/brand-icons` components (CC0 paths from Simple Icons 15)

**BREAKING:** Upgrade to Skeleton 5. The `auth` theme uses the Skeleton 5 token names (`--typo-*`, `--color-root-bg-*`, brand/outline/corner-shape tokens) and no longer ships a copy of the Skeleton 4 component styles; it restores the pointer cursor on buttons, checkboxes and radios that Skeleton 5 dropped, and keeps badge text at `text-xs` (Skeleton 5 shrinks it to 0.8 × `text-xs`). The API key dialog uses `field-group` instead of the removed `input-group`/`ig-*` classes. Components now follow Skeleton 5's defaults (e.g. bold pill badges, neutral `preset-tonal`).
