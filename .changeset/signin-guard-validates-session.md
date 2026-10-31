---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix: The sign-in page no longer sends a signed-out reader home because of a session cookie Better Auth doesn't accept. The guard (`hooks.server.ts` in SvelteKit, `proxy.ts` in Next.js) redirected `/signin` to `/` whenever `getSessionCookie()` found a session cookie, but that function also accepts one Better Auth no longer reads, for example `better-auth.session_token` once the cookies became `__Secure-` (after setting `BETTER_AUTH_BASE_URL_PROTOCOL=https`, or after the Secure cookies fix in this release). Such a reader couldn't reach sign-in until the old cookie expired, up to 7 days. On `/signin` with a session cookie, the guard now asks the app's own `/api/auth/get-session` and redirects only when it returns a session; no session or a failed request shows sign-in. Other routes keep the optimistic cookie check and cost no extra request.
