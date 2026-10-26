---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix: Screen readers now announce the password strength meter. In Svelte, the meter had no progressbar role and no value attributes, so it was silent; it now renders Ark UI's `Progress.Track` and `Progress.Range`, like the Next.js meter. In both, the progressbar is named "Password strength" (Next.js announced the fill percentage as its name) and carries the score as `aria-valuenow` from 0 to 4, with `aria-valuetext` "Weak", "Fair", "Good" or "Strong" once a password has a score. The meter looks the same. Update it with `jsrepo update primitives`.
