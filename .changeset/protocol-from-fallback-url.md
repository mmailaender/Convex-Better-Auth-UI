---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix: Session cookies are now `Secure` on deployments whose `BETTER_AUTH_FALLBACK_URL` is `https://`, without setting `BETTER_AUTH_BASE_URL_PROTOCOL`. With the dynamic `baseURL`, Better Auth decides at startup whether cookies get the `__Secure-` prefix and the `Secure` attribute. Without a protocol it decided by `NODE_ENV === 'production'`, which is false on Convex, so those cookies were set without `Secure`. The auth config now sets `advanced.useSecureCookies` when the fallback URL is `https://` and no valid `BETTER_AUTH_BASE_URL_PROTOCOL` is set. Only the cookies change: URLs keep the protocol of each request. A valid `BETTER_AUTH_BASE_URL_PROTOCOL` (`http`, `https` or `auto`) still decides as before. Update it with `jsrepo update config`, keeping your own `auth.constants.ts`.

On such a deployment, everyone is signed out once after the update: the session cookie is now named `__Secure-better-auth.session_token`, and Better Auth no longer reads the old `better-auth.session_token`. They sign in again as usual; update the sign-in guard as well (see the sign-in guard fix in this release), or the old cookie keeps them away from `/signin` until it expires.

Local development keeps an `http://` `BETTER_AUTH_FALLBACK_URL`, the documented default. With an `https://` fallback, an app served on `http://localhost` also gets `Secure`, `__Secure-` cookies: current Chrome and Firefox accept them on `localhost`, but Safari on older macOS versions does not, so sign-in fails there.

Previews served over HTTPS whose `BETTER_AUTH_FALLBACK_URL` is `http://` (for example shared defaults pointing at `http://localhost`) still need `BETTER_AUTH_BASE_URL_PROTOCOL=https` for Secure cookies. Set it in the Convex project's default environment variables for preview deployments only, since local development runs on http.
