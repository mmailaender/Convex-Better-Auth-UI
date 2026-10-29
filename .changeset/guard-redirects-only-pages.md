---
'@auth/svelte': patch
---

fix: signed out, a request to a protected path is sent to `/signin` only when it can show that page: a page navigation, or SvelteKit's own page-data, remote-function and form-action requests, whose redirect its router follows. A script, an image or a `fetch` now gets `401 Sign-in required` instead of the sign-in page's HTML, which a script would fail to parse (`SyntaxError: Unexpected token '<'`).
