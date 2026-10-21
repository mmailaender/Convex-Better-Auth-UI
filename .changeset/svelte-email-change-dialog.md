---
'@auth/svelte': patch
---

fix: After confirming an email change, the user lands back in the profile dialog again. The confirmation link returned to `?dialog=profile`, but the dialog opens on `?dialog=user-profile`. Update it with `jsrepo update users/lib`.
