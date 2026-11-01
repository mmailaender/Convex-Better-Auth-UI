---
'@auth/nextjs': patch
---

**Upgrading from 0.3.0:** Make the manual changes below, then update the items you installed with the one command at the end. The entries after this one describe each change and don't need their own update.

#### Migration

1. If you changed `auth.ts` (`config`), merge the update into it instead of overwriting it: the `imageId` and `activeOrganizationId` user fields and, with organizations, the `logoId` organization field get `input: false`.
2. Run the update. Leave out items you haven't installed, but update `config` together with `users/convex` and, with organizations, `organizations/convex`: with the new `auth.ts`, Better Auth refuses the writes the previous `users/convex` and `organizations/convex` made, so avatar uploads and organization switching would fail.

→ `jsrepo update 'config' 'users/convex' 'organizations/convex'`
