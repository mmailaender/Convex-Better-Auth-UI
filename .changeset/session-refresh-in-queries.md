---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix: Better Auth no longer tries to refresh the session inside Convex queries, where it can't write. The Convex plugin skipped that refresh with an injected query parameter, but endpoints that validate their query strip it, so their session lookups failed whenever the session was due for a refresh. The API keys list hit this for every admin impersonation session and returned 401. `auth.ts` (`config`) now sets `session.disableSessionRefresh` outside mutations and actions; update it with `jsrepo update config`, keeping your own `auth.constants.ts`.
