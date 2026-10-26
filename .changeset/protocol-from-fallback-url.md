---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix: Session cookies are now `Secure` on deployments whose `BETTER_AUTH_FALLBACK_URL` is `https://`, without setting `BETTER_AUTH_BASE_URL_PROTOCOL`. With the dynamic `baseURL`, Better Auth decides at startup whether cookies get the `__Secure-` prefix and the `Secure` attribute. Without a protocol it decided by `NODE_ENV === 'production'`, which is false on Convex, so those cookies were set without `Secure`. The auth config now sets `advanced.useSecureCookies` when the fallback URL is `https://` and no valid `BETTER_AUTH_BASE_URL_PROTOCOL` is set. Only the cookies change: URLs keep the protocol of each request, so an `http://localhost` host allowed next to an `https://` fallback keeps working. A valid `BETTER_AUTH_BASE_URL_PROTOCOL` (`http`, `https` or `auto`) still decides as before. Update it with `jsrepo update config`, keeping your own `auth.constants.ts`.

Previews served over HTTPS whose `BETTER_AUTH_FALLBACK_URL` is `http://` (for example shared defaults pointing at `http://localhost`) still need `BETTER_AUTH_BASE_URL_PROTOCOL=https` for Secure cookies. Set it in the Convex project's default environment variables for preview deployments only, since local development runs on http.
