---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix(organizations): The organization settings keep their form through a failed or reloading organization lookup, and close an open edit when another organization becomes active. The General tab rendered its form only while both the user and the active organization answered, so a moment without an answer unmounted it: a name being typed was lost and focus fell to `<body>`. It now holds the last answer while a lookup fails or loads, and drops it only on `null`, a confirmed absence, or when the session signs out. When the answer names another organization, an open name or slug edit and the logo crop dialog close, focus moves to the control that opened them, and the change is announced. Before, an edit stayed open after a switch, and saving it renamed the newly active organization with the previous one's edit. A crop confirmed for one organization is dropped once another is shown, and the image cropper no longer calls back after it is gone.
