---
'@auth/svelte': patch
---

**Upgrading from 0.11.0:** Make the manual changes below, then update the items you installed with the one command at the end. The entries after this one describe each change and don't need their own update.

#### Migration

1. If you changed `auth.ts` (`config`), merge the update into it instead of overwriting it: the `imageId` and `activeOrganizationId` user fields and, with organizations, the `logoId` organization field get `input: false`.
2. If you changed `auth.ts` (`config`), also merge its new session triggers: `onCreate` gives every new session the user's active organization, and `onUpdate` calls `setUserActiveOrganization` when a session's active organization changes.
3. Run the update. Leave out items you haven't installed, but update `config` together with `users/convex` and, with organizations, `organizations/convex`: with the new `auth.ts`, Better Auth refuses the writes the previous `users/convex` and `organizations/convex` made, so avatar uploads and organization switching would fail, and its session trigger calls `setUserActiveOrganization` from the new `organizations/convex`.
4. Optional, with organizations: sessions signed in before the update keep their own active organization until the user next switches, leaves, creates or deletes an organization, or signs in again. To align them at once, run `components.betterAuth.organization.setUserActiveOrganization` once for each user that has an `activeOrganizationId`, with that value, from an internal mutation of your app that pages through the users.

→ `jsrepo update 'config' 'users/convex' 'organizations/convex' 'organizations/lib'`
