---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix(organizations): The organization switcher's button now always has an accessible name. Its only name came from the active organization's name, so while that was loading, screen readers met an unnamed button, and axe reported `button-name`. It now reads "Switch organization" while loading and "Organization: <name>" once the name is known. The visible text is unchanged.
