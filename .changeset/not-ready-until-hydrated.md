---
'@auth/svelte': patch
---

fix: The account controls the server renders are marked not ready until the page hydrates: `UserButton`'s account button and "Sign in" button, and `OrganizationSwitcher`'s switcher and "Create Organization" button. A click on one of them before hydration reached no handler and was lost. Now assistive technology announces the control as unavailable until it works, and Playwright's `click()` waits for it. The new `WaitsForHydration` primitive puts `aria-disabled="true"` on a `display: contents` wrapper around the control and removes it once mounted, so the control looks exactly the same before and after hydration.
