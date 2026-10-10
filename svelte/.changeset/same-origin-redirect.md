---
'auth': patch
---

Only follow a sign-in or organization redirect to a path on the app's own site. `redirectTo` (component prop or query parameter) on `SignIn`, `CreateOrganization` and `DeleteOrganization` that points to another host, such as `https://attacker.example`, `//attacker.example` or `/..//attacker.example`, now goes home instead. Better Auth callbacks (email verification, magic link, social sign-in) are sent as absolute URLs on the current origin. The new `auth/utils/safeRedirect.ts` holds the rule.
