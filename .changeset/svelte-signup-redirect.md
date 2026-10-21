---
'@auth/svelte': patch
---

fix: Signing up with a password now redirects like signing in does when `sendEmails` is off. The sign-up never told the sign-in screen it had succeeded, so the new user stayed on the form although Better Auth had already signed them in. Update it with `jsrepo update auth/lib`.
