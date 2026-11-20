---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix(organizations): `getActiveOrganization` and `listOrganizations` no longer answer "none" when a lookup fails. Both caught every error and answered `null` / `[]`, so a client could not tell a failed read from an organization that is really gone, and the widgets acted on it: the organization switcher filled in an organization, and the organization settings closed. They now answer `null` / `[]` only for a confirmed absence: no one signed in, the session or user gone, no active organization, or no longer a member, which `getActiveOrganization` reads from the member row before asking Better Auth for the full organization. A lookup that fails throws. `getActiveOrganization` names the user's `activeOrganizationId` instead of relying on the session's copy.

The widgets treat a failure as still loading: the switcher fills in an organization only when the answer is `null`, the Next.js hooks read the two queries without throwing into an error boundary, and the SvelteKit layout's server load leaves a failed lookup to the browser instead of failing the page.
