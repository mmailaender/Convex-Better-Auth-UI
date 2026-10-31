---
'@auth/nextjs': patch
---

fix: On the sign-in page, an email typed before the page has hydrated is kept. React reset the field to empty on its first render after hydration, so the text disappeared and "Continue with Password" stayed disabled. `EmailStep` now takes the field's text into state when it mounts.
