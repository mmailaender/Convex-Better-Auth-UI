---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix: Session cookies are now `Secure` on HTTPS deployments that don't set `BETTER_AUTH_BASE_URL_PROTOCOL`. With the dynamic `baseURL`, Better Auth decides at startup whether cookies get the `__Secure-` prefix and the `Secure` attribute. Without a protocol it decides by `NODE_ENV === 'production'`, which is false on Convex, so those cookies were set without `Secure`. When `BETTER_AUTH_BASE_URL_PROTOCOL` is unset or invalid, the protocol now comes from `BETTER_AUTH_FALLBACK_URL`: an `https://` fallback gives `https` and Secure cookies. An `http://` fallback changes nothing: the protocol still comes from each request, as before. A valid `BETTER_AUTH_BASE_URL_PROTOCOL` (`http`, `https` or `auto`) still wins. Update it with `jsrepo update config`, keeping your own `auth.constants.ts`.

Previews served over HTTPS whose `BETTER_AUTH_FALLBACK_URL` is `http://` (for example shared defaults pointing at `http://localhost`) still need `BETTER_AUTH_BASE_URL_PROTOCOL=https` for Secure cookies; set it in the Convex project's default environment variables for preview deployments only, since local development runs on http.
