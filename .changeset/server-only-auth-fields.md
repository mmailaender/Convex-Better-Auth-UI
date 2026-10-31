---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix(security): Clients can no longer set the Better Auth fields the server trusts. `auth.ts` (`config`) declared the user fields `imageId` and `activeOrganizationId` and the organization field `logoId` without `input: false`, so Better Auth's own endpoints accepted them from the browser. Any signed-in user could call `/api/auth/update-user` with an `activeOrganizationId` of an organization they don't belong to, which the server copies into each new session as its active organization without checking the membership, or point their `imageId` at another user's file, which the server then deleted on their next avatar change or when their account was deleted. `/api/auth/organization/create` and `/api/auth/organization/update` did the same for an organization's `logoId`. The three fields are now `input: false`: `/update-user` and sign-up refuse them, and the organization endpoints drop them.

The server keeps writing them, through the Better Auth component, after its own checks: `updateAvatar` (`users/convex`) stores `imageId`, `setActiveOrganization`, `deleteOrganization` and `leaveOrganization` (`organizations/convex`) store `activeOrganizationId` once Better Auth has accepted the switch, and `createOrganization` and `updateOrganizationProfile` store `logoId` once Better Auth has created the organization or accepted the update. The admin dashboard already wrote the logo through the component and changes nothing.

Two bugs in the same paths are fixed too. `setActiveOrganization` without an `organizationId`, for a user with no active organization yet, failed with `401 UNAUTHORIZED`: it saved the choice through `auth.api.updateUser` without the session headers. And removing a logo through `updateOrganizationProfileModel` with `logoId: null` deleted the file but left `logo` and `logoId` pointing at it.

If you copied `auth.ts` into your app instead of updating it with jsrepo, add `input: false` to those three `additionalFields` yourself, and to any field of your own that your server trusts, and update `users/convex` and `organizations/convex` with it (see the upgrade entry).
