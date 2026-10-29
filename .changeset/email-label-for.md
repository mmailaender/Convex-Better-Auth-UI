---
'@auth/svelte': patch
---

fix: the sign-in page's "Email" label names its field again. The label pointed at `" email"`, with a leading space, so it wasn't linked to the email input: screen readers announced the field without a name, and a click on the label didn't focus it.
