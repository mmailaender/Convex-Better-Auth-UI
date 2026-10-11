---
'@auth/svelte': minor
---

**BREAKING:** Migrate to SvelteKit 3. Components now import library code through the `#lib` subpath import instead of `$lib`, the `base` item ships a `vite.config.ts` (SvelteKit 3 no longer reads `svelte.config.js`), declares the Convex URLs in `src/env.ts` (SvelteKit 3 only exposes environment variables declared there, including to `$env/static/public`), and navigation uses the SvelteKit 3 `goto` options (`replace`, `reset`, `refreshAll`).

#### Migration

1. Upgrade your app to SvelteKit 3 by following https://svelte.dev/docs/kit/migrating-to-sveltekit-3 (`npx sv migrate sveltekit-3`).
2. Make sure your `package.json` declares the `#lib` subpath import (`"imports": { "#lib": "./src/lib/index.js", "#lib/*": "./src/lib/*" }`) and set `paths.lib` to `#lib` in your jsrepo config.
3. Add `src/env.ts` declaring `PUBLIC_CONVEX_URL` and `PUBLIC_CONVEX_SITE_URL` as public static variables (shipped with `base`).
4. Move the `$convex` alias from `svelte.config.js` into the `sveltekit({ alias: { $convex: './src/convex' } })` options in `vite.config.ts`.

→ `jsrepo update 'base' 'base/ssr' 'primitives' 'auth/lib' 'auth/routes' 'users/lib' 'organizations/lib' 'organizations/routes' 'admin/lib' 'admin/routes' 'device-authorization/routes'`
