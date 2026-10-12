---
'@auth/svelte': minor
---

**BREAKING:** Migrate to SvelteKit 3. Components now import library and Convex code through the `#lib` and `#convex` subpath imports instead of the `$lib` and `$convex` aliases, the `base` item ships a `vite.config.ts` (SvelteKit 3 no longer reads `svelte.config.js`), declares the Convex URLs in `src/env.ts` (SvelteKit 3 only exposes environment variables declared there, including to `$env/static/public`), and navigation uses the SvelteKit 3 `goto` options (`replace`, `reset`, `refreshAll`).

chore: Upgrade `@mmailaender/convex-better-auth-svelte` to 0.9.0, `@ark-ui/svelte` to 5.24, `@lucide/svelte` to 1.x, `svelte-sonner` to 1.2, Vite to 8.3, Vitest to 5 and the lint/format tooling; drop the unused `vaul-svelte`, `mode-watcher` and `@internationalized/date`

chore: Upgrade Convex to 1.46, `@convex-dev/better-auth` to 0.12.5, `@convex-dev/resend` to 0.2.9, `@convex-dev/migrations` to 0.3.7 and `convex-helpers` to 0.1.128; `updateUser` now uses the validator's built-in `.partial()` instead of the deprecated `convex-helpers` helper

#### Migration

1. Upgrade your app to SvelteKit 3 by following https://svelte.dev/docs/kit/migrating-to-sveltekit-3 (`npx sv migrate sveltekit-3`).
2. Declare the subpath imports in your `package.json` (`"imports": { "#lib": "./src/lib/index.js", "#lib/*": "./src/lib/*", "#convex/*": "./src/convex/*" }`) and set `paths.lib` to `#lib` in your jsrepo config.
3. Add `src/env.ts` declaring `PUBLIC_CONVEX_URL` and `PUBLIC_CONVEX_SITE_URL` as public static variables (shipped with `base`).
4. Remove the `$convex` alias from your config (SvelteKit 3 deprecates `config.alias`); `#convex/*` replaces it.

→ `jsrepo update 'base' 'base/ssr' 'primitives' 'auth/lib' 'auth/routes' 'users/convex' 'users/lib' 'organizations/lib' 'organizations/routes' 'admin/lib' 'admin/routes' 'device-authorization/routes'`
