---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix(organizations): Every session of a user now shows the same active organization. The active organization was stored twice, on the user (`activeOrganizationId`, which new sessions copy and server code reads) and on each session (which Better Auth's organization endpoints read when a call names no organization), and a switch wrote only the user and the session that made it. A user signed in twice saw one organization in one session and another in the second, and server code that reads the user acted on an organization the second session didn't show. The user's `activeOrganizationId` is now the one source: `setUserActiveOrganization` (`betterAuth/organization.ts`) writes it and every session's copy in one transaction, and switching, leaving, deleting and creating an organization use it. A new session takes the user's organization, also when Better Auth created it with another one. When Better Auth switches a session itself (accepting an invitation, leaving or deleting the active organization), the new session `onUpdate` trigger in `auth.ts` moves the user and their other sessions along; clients can't write the session's copy, as Better Auth's organization plugin declares it `input: false`.

`setUserActiveOrganization` checks in the same transaction that the organization still exists and the user still belongs to it. Better Auth checks the membership in an earlier transaction than the one that writes the session, so a member who left an organization in between could make it active again; now the user keeps their current organization if they still belong to it, and otherwise gets none. A new session whose user's organization no longer has them takes their first membership.

Changing a member's role in `Members` names the organization explicitly instead of relying on the session's copy.
