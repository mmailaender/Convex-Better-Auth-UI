---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix: The organization members list applies one rule on desktop and mobile: owners and admins can change the role of and remove any member, other admins included, as Better Auth's server allows. The list doesn't offer it for an owner or for yourself; that is a choice of the UI, not a server check. The mobile drawer used to stop an admin from editing another admin while the desktop table allowed it. In Svelte, your own row no longer shows a role picker and a remove button either, because the list compared member ids with your user id.
