---
'@auth/nextjs': patch
---

fix: signed out, a request to a protected path is sent to `/signin` only when it can show that page: a page navigation, or the App Router's own request on a client navigation or a prefetch, whose redirect its router follows. A script, an image, a `fetch` to a route handler or a server action now gets `401 Sign-in required` instead of the sign-in page's HTML, which a script would fail to parse (`SyntaxError: Unexpected token '<'`) and a server action can't follow.
