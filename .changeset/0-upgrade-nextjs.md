---
'@auth/nextjs': minor
---

**Upgrading from 0.2.0:** Make the manual changes below, then update the items you installed with the one command at the end. The entries after this one describe each change and don't need their own update.

#### Migration

1. Upgrade `next` to 16.4.3 (see the security note below) and `@skeletonlabs/skeleton` to 5. Migrate any custom theme with `npx skeleton migrate skeleton-5` (see https://skeleton.dev).
2. If you set the `BRAND_NAME` or `BRAND_TAGLINE` Convex env vars, move their values into `brandName` and `brandTagline` in `auth.constants.ts` and remove the variables. The emails no longer read them.
3. Delete `src/app/device-authorization/[code]/page.tsx`. The device page now lives at `/device?user_code=…`; point any links of your own there.
4. If you keep your own `next.config.mjs`, remove its `turbopack` block.
5. Keep your own `auth.constants.ts` when the update offers to overwrite it. If you changed any of these files, merge the update into them instead of overwriting:
   - `src/proxy.ts` (`base`): the `/signin` redirect checks the session with `hasValidSession`, and a signed-out request to a protected path is redirected only when it can show the sign-in page.
   - `auth/ui/EmailStep.tsx` (`auth/lib`): a `useLayoutEffect` reads the input's value on mount.
6. Run the update. Leave out items you haven't installed, but update `config` together with `users/convex` and, with organizations, `organizations/convex`: the new `auth.ts` calls functions they add or change. `base` now also installs `admin/lib` and `admin/convex`, because the root layout mounts the impersonation banner; it renders nothing while `admin` is off.

→ `jsrepo update 'config' 'base' 'primitives' 'themes' 'auth/lib' 'users/convex' 'users/lib' 'organizations/convex' 'organizations/lib' 'email/convex' 'device-authorization/convex' 'device-authorization/routes'`
