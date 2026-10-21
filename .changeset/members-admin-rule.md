---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix: The organization members list applies one rule on desktop and mobile, the one Better Auth enforces on the server: owners and admins can change the role of and remove any member, other admins included, but not an owner and not themselves. The mobile drawer used to stop an admin from editing another admin while the desktop table allowed it. In Svelte, your own row no longer shows a role picker and a remove button either, because the list compared member ids with your user id. Update it with `jsrepo update organizations/lib`.
