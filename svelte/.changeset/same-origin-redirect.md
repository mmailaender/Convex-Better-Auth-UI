---
'auth': patch
---

Only follow a sign-in or organization redirect to a path on the app's own site. `redirectTo` (component prop or query parameter) on `SignIn`, `CreateOrganization` and `DeleteOrganization` is honoured only as a same-origin path starting with a single `/`; any other value, such as `https://attacker.example` or `//attacker.example`, falls back to the default destination. Better Auth callbacks (email verification, magic link, social sign-in) are sent as absolute URLs on the current origin. The new `auth/utils/signInRedirect.ts` holds the rule.
