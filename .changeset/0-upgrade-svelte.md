---
'@auth/svelte': minor
---

**Upgrading from 0.10.0:** Make the manual changes below, then update the items you installed with the one command at the end. The entries after this one describe each change and don't need their own update.

#### Migration

1. Upgrade your app to SvelteKit 3 by following https://svelte.dev/docs/kit/migrating-to-sveltekit-3 (`npx sv migrate sveltekit-3`).
2. Declare the subpath imports in your `package.json` (`"imports": { "#lib/*": "./src/lib/*", "#convex/*": "./src/convex/*" }`). In `jsrepo.config.ts`, set `paths.lib` to `./src/lib`, not `$lib` or `#lib`. jsrepo only resolves aliases through tsconfig `paths`, which SvelteKit 3 no longer generates, so an alias would make it write the files into a literal `$lib/` or `#lib/` folder. jsrepo rewrites the components' `#lib/...` imports to relative paths.
3. Remove the `$convex` alias from your config (SvelteKit 3 deprecates `config.alias`); `#convex/*` replaces it.
4. Upgrade `@skeletonlabs/skeleton` to 5 and migrate any custom theme with `npx skeleton migrate skeleton-5` (see https://skeleton.dev).
5. If you set the `BRAND_NAME` or `BRAND_TAGLINE` Convex env vars, move their values into `brandName` and `brandTagline` in `auth.constants.ts` and remove the variables. The emails no longer read them.
6. Keep your own `auth.constants.ts` when the update offers to overwrite it. Merge these files instead of overwriting them:
   - `src/env.ts`, `src/hooks.ts` and `vite.config.ts` (`base`). `src/env.ts` must declare `PUBLIC_CONVEX_URL` and `PUBLIC_CONVEX_SITE_URL` as public static variables next to your own (SvelteKit 3 hides undeclared variables). `src/hooks.ts` must call `initConvex(PUBLIC_CONVEX_URL)`: `@mmailaender/convex-better-auth-svelte` 0.10 no longer reads the Convex URLs by itself, and without it every page and `/api/auth/*` request fails with `Convex URL not set`. `vite.config.ts` must keep your own plugins and `sveltekit()` options.
   - If you changed it, `src/hooks.server.ts` (`base/ssr`): the `/signin` redirect checks the session with `hasValidSession`, and a signed-out request to a protected path is redirected only when it can show the sign-in page.
   - If you changed them, `users/ui/UserButton.svelte` (`users/lib`) and `organizations/ui/OrganizationSwitcher.svelte` (`organizations/lib`): their triggers are wrapped in `<WaitsForHydration>`.
7. Run the update. Leave out items you haven't installed, but update `config` together with `users/convex` and, with organizations, `organizations/convex`: the new `auth.ts` calls functions they add or change. `base` now also installs `admin/lib` and `admin/convex`, because the root layout mounts the impersonation banner; it renders nothing while `admin` is off.

→ `jsrepo update 'config' 'base' 'base/ssr' 'primitives' 'themes' 'auth/lib' 'auth/routes' 'users/convex' 'users/lib' 'organizations/convex' 'organizations/lib' 'organizations/routes' 'email/convex' 'device-authorization/convex' 'device-authorization/routes'`
