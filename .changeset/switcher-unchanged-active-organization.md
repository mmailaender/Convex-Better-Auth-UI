---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix(organizations): The organization switcher no longer refreshes the page when filling in a missing active organization changes nothing. When the active-organization query answered empty for a moment, the switcher called `setActiveOrganization` without an id; the server kept the user's organization, but the switcher refreshed the page anyway. In SvelteKit that navigation dropped the URL's hash and moved focus to `<body>`, out of an open dialog; in Next.js it was a needless `router.refresh()`. `setActiveOrganization` now answers `{ changed }`, and the switcher leaves the page alone when a fill-in answers `changed: false`. Explicit switches, and a fill-in that does make an organization active, refresh as before.
