# Deploying the demo apps

The demo apps `nextjs/` and `svelte/` deploy to Vercel and to Cloudflare Workers from the same branch. Each runs a build script at the repository root from its app folder: `vercel.sh` on Vercel, `cloudflare.sh` on Cloudflare. Both need Node.js 24.22 or later, which Cloudflare's `cf` CLI requires.

## Convex backends

| Build                          | Convex backend                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Vercel production (`main`)     | production, deployed by `vercel.sh`                                                                     |
| Vercel preview                 | `<branch>-<app>`, deployed by `vercel.sh`                                                               |
| Cloudflare production (`main`) | production, **not** deployed: `cloudflare.sh` only builds against it, so Vercel stays its only deployer |
| Cloudflare preview             | `<branch>-<app>-cf`, deployed by `cloudflare.sh`                                                        |

Every app and platform has its own preview backend, so no two builds push to one backend at the same time.

## Vercel

Two projects, `auth-nextjs` and `auth-svelte`, with root directories `nextjs` and `svelte`. Build command: `sh ../vercel.sh`. Variable: `CONVEX_DEPLOY_KEY`, the production deploy key for production and a preview deploy key for previews.

## Cloudflare Workers Builds

Two Workers. Each Worker's name must match its configuration, `nextjs/cloudflare.config.ts` and `svelte/wrangler.jsonc`.

| Setting                         | `convex-better-auth-ui-nextjs`                                                         | `convex-better-auth-ui-svelte`                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Root directory                  | `/nextjs`                                                                              | `/svelte`                                                                        |
| Build command                   | `sh ../cloudflare.sh`                                                                  | `sh ../cloudflare.sh`                                                            |
| Deploy command (Production)     | `npx vinext-cloudflare deploy --skip-build`                                            | `npx wrangler deploy`                                                            |
| Preview command (Previews Base) | `npx vinext-cloudflare previews deploy --skip-build`                                   | `npx wrangler preview`                                                           |
| Production variables            | `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`: the production backend's URLs | `PUBLIC_CONVEX_URL`, `PUBLIC_CONVEX_SITE_URL`: the production backend's URLs     |
| Previews Base secret            | `CONVEX_DEPLOY_KEY`: a preview deploy key                                              | `CONVEX_DEPLOY_KEY`: a preview deploy key                                        |
| Preview URLs                    | on (Settings → Domains & Routes)                                                       | on                                                                               |
| Build watch paths               | `nextjs/*`, `shared/*`, `cloudflare.sh`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`       | `svelte/*`, `shared/*`, `cloudflare.sh`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` |

## Convex environment variables

Better Auth accepts requests only from the hosts in `BETTER_AUTH_ALLOWED_HOSTS`. Add every host the apps are served from:

- **Production deployment:** the production domains, including the two Workers' `workers.dev` hosts if sign-in should work there.
- **Preview defaults** (Project Settings → Environment Variable Defaults → Preview), which each new preview backend copies when it's created:
  - `BETTER_AUTH_ALLOWED_HOSTS`: the Vercel preview hosts, plus `*-convex-better-auth-ui-nextjs.<subdomain>.workers.dev,*-convex-better-auth-ui-svelte.<subdomain>.workers.dev`.
  - `BETTER_AUTH_FALLBACK_URL`: any URL, for example `http://localhost:5173`. Without it, server-rendered pages of a signed-in user fail.
  - `BETTER_AUTH_BASE_URL_PROTOCOL="https"`, so previews get Secure cookies.
