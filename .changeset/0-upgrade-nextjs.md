---
'@auth/nextjs': patch
---

**Upgrading from 0.3.0:** Make the manual changes below, then update the items you installed with the one command at the end. The entries after this one describe each change and don't need their own update.

#### Migration

1. Upgrade Better Auth and the Convex component together: `better-auth` and `@better-auth/api-key` to 1.7.17, `@convex-dev/better-auth` to 0.13.0. The component's 0.13 requires Better Auth 1.7.16 or later.
2. If you changed `betterAuth/adapter.ts` or `betterAuth/generatedSchema.ts` (`config`), merge the update into them: the adapter exports Better Auth 1.7's `consumeOne` and `incrementOne`, and the schema adds the `accountId_providerId_userId` index on `account` and the optional `alg` and `crv` fields on `jwks`. If you added Better Auth plugins of your own, regenerate `generatedSchema.ts` from `src/convex/betterAuth` with `npx auth@1.7 generate --output generatedSchema.ts` instead and keep its additions; see the component's [upgrade guide](https://labs.convex.dev/better-auth/upgrading/from-0-12).
3. Check `BETTER_AUTH_ALLOWED_HOSTS` and `BETTER_AUTH_FALLBACK_URL`: with component 0.13, Better Auth builds its links and OAuth callbacks from your app's origin only when that origin is listed without a wildcard or is the fallback URL's origin. On a host that matches only a wildcard, such as a preview deployment's, it uses your deployment's `.convex.site` URL instead, so email links and OAuth callbacks leave your app. For previews with their own Convex preview deployment, set that deployment's `BETTER_AUTH_FALLBACK_URL` to the preview's URL in your build, after `convex deploy`: `npx convex env set BETTER_AUTH_FALLBACK_URL <preview URL> --preview-name <preview name>`.
4. If you changed `auth.ts` (`config`), merge the update into it instead of overwriting it: the `imageId` and `activeOrganizationId` user fields and, with organizations, the `logoId` organization field get `input: false`.
5. If you changed `auth.ts` (`config`), also merge its new session triggers: `onCreate` gives every new session the user's active organization, and `onUpdate` calls `setUserActiveOrganization` when a session's active organization changes.
6. Run the update. Leave out items you haven't installed, but update `config` together with `users/convex` and, with organizations, `organizations/convex`: with the new `auth.ts`, Better Auth refuses the writes the previous `users/convex` and `organizations/convex` made, so avatar uploads and organization switching would fail, and its session trigger calls `setUserActiveOrganization` from the new `organizations/convex`.
7. Optional, with organizations: sessions signed in before the update keep their own active organization until the user next switches, leaves, creates or deletes an organization, or signs in again. To align them at once, run `components.betterAuth.organization.setUserActiveOrganization` once for each user that has an `activeOrganizationId`, with that value, from an internal mutation of your app that pages through the users.

→ `jsrepo update 'config' 'users/convex' 'organizations/convex' 'organizations/lib' 'users/lib'`
