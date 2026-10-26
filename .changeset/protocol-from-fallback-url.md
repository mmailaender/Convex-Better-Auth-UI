---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix: Session cookies are now `Secure` on HTTPS deployments that don't set `BETTER_AUTH_BASE_URL_PROTOCOL`. With the dynamic `baseURL`, Better Auth decides at startup whether cookies get the `__Secure-` prefix and the `Secure` attribute. Without a protocol it decides by `NODE_ENV === 'production'`, which is false on Convex, so those cookies were set without `Secure`. When `BETTER_AUTH_BASE_URL_PROTOCOL` is unset or invalid, the protocol now comes from `BETTER_AUTH_FALLBACK_URL`: an `https://` fallback gives `https` and Secure cookies, an `http://` fallback gives `http`. A valid `BETTER_AUTH_BASE_URL_PROTOCOL` (`http`, `https` or `auto`) still wins. Update it with `jsrepo update config`, keeping your own `auth.constants.ts`.

#### Migration

If a deployment serves HTTPS hosts but its `BETTER_AUTH_FALLBACK_URL` is `http://` (for example preview deployments whose default fallback points at `http://localhost`), set `BETTER_AUTH_BASE_URL_PROTOCOL=https` in its environment (for previews, in the Convex project's default environment variables). Otherwise Better Auth now builds `http://` URLs for those hosts and trusts only their `http://` origins.
