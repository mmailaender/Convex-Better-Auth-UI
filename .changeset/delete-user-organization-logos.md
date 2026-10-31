---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix: Deleting a user who is the only member of an organization they own now deletes the organization's logo too. The Better Auth component tried to delete it from its own file storage, which doesn't hold the app's files; `deleteUser` in `betterAuth/organization.ts` (`organizations/convex`) now returns the logo ids, and the user `onDelete` trigger in `auth.ts` (`config`) deletes them. A member whose roles include `owner` next to another role (Better Auth stores them comma-separated, such as `owner,admin`) now counts as an owner there as well: an organization they own alone is deleted with them, and one with other members blocks the deletion, instead of losing its owner.
