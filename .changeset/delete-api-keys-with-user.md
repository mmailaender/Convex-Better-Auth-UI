---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix: Deleting a user now deletes their API keys. Better Auth left them behind, and they kept verifying after the account was gone. The user `onDelete` trigger in `auth.ts` (`config`) calls a new `betterAuth/user.ts` mutation (`users/convex`).
