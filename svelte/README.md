1. Install convex-svelte
2. Install convex-auth
3. Add convex alias to svelte.config.js

```ts
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		alias: {
			$convex: './src/convex'
		}
	}
};
```

4. Create /login page
5. Add handleAuthRedirect function to hooks.server.ts

```ts
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { createConvexAuthHooks, createRouteMatcher } from '@convex-dev/auth/sveltekit/server';

const { handleAuth, isAuthenticated: isAuthenticatedPromise } = createConvexAuthHooks();

const isSignInRoute = createRouteMatcher('/login');

export const handleAuthRedirect: Handle = async ({ event, resolve }) => {
	if (isSignInRoute(event.url.pathname)) {
		const isAuthenticated = await isAuthenticatedPromise(event);
		if (isAuthenticated) {
			return redirect(307, '/');
		}
	}

	return resolve(event);
};

// [...]

export const handle = sequence(handleAuth, handleAuthRedirect);
```

1. Add Social Provider
2. Add for every social provider you want to use the environment variables `<socialprovider>_CLIENT_ID` and `<socialprovider>_CLIENT_SECRET`
3. uncomment the social provider you want in `src/lib/auth/social/oauth.ts`
4. Emails
5. If you want to verify emails if they are temporary/invalid mails go to `src/lib/email/api/server.ts` > `verifyEmail()` and adjust the https://emailverifier.reoon.com URL to the one that you want to use. If you're happy with reoon, simply add to your environment variables the `REOON_EMAIL_VERIFIER_TOKEN` variables.
6. We're using for sending emails `resend`. If you want to keep it, simply add your `RESEND_API_KEY` as environment variable. If you prefer another service, go to `src/lib/emails/index.ts` and change the `send` function to your email provider.
7. Set `EMAIL_SEND_FROM` as environment variable to the email you want to send your mails from e.g. verifications@example.com . Please also ensure that you have configured this email/domain in resend our your email provider of choice.
8. Update your company image (Used e.g. for sending emails)
9. Add CUSTOM_DOMAINS as environment variables. That is on production your custom urls e.g. in our case etesie.dev. on .env.local it will be your localhost server with port - probably `localhost:5173,127.0.0.1:5173`
10. Create in your fauna dashboard for your database the key `FAUNA_SIGNIN_KEY`with the role `role_signIn` and add it the value to your environment variables
11. Changing/store avatars: Add Vercel BLOB_READ_WRITE_TOKEN. If you want to change this, update `src/lib/primitives/api/storage/upload.ts`
12. Add protected routes

## Protected routes

Named path parameters wrapped with a square bracket (e.g., [id], [slug], [any]).
Wildcard token, \*, which matches the remainder of the path, or everything in the middle or at the beginning.

| /orgs/acmecorp | ✅ | acmecorp |
Example 1
`/orgs/[slug]`
| URL | Matches | [slug] value |
| ---- | ---------- | ------------ |
| /orgs/acmecorp | ✅ | acmecorp |
| /orgs | ❌ | n/a |
| /orgs/acmecorp/settings | ❌ | n/a |

Example 2

`/app/[any]/orgs/[id]`
| URL | Matches | [id] value |
| ---- | ---------- | ------------ |
| /app/petstore/orgs/org_123 | ✅ | org_123 |
| /app/dogstore/v2/orgs/org_123 | ❌ | n/a |

Example 3

`/personal-account/*`
| URL | Matches |
| ---- | ----------- |
| /personal-account/settings | ✅ |
| /personal-account | ❌ |

## Upgrade localhost to https

1. installing a local certificate authority with mkcert on my WSL | mkcert -install
2. creating a certificate in my project | mkdir cert && mkcert -key-file cert/key.pem -cert-file cert/cert.pem localhost

### On Windows:

3. installed the certificate also on windows side with certlm
   3.1. Get the root certification location | mkcert -CAROOT
   3.2. Open the tool Certmgr.exe (Certificate Manager Tool) on windows (if not available it needs to be first activated)
   3.3. Go to Trusted Root Certification Authorities > Certificates
   3.4. Scroll to the end of the list and right click on some white space > All taks > import and then import the rootCA.pem from the root certification location

## Init your project

`pnpm init:repo`

## Virtual authenticator

To use the Virtual Authenticator as part of the Chrome DevTools for testing passkeys in your development environment, follow these steps:

1. Open Chrome and navigate to the DevTools by pressing `Ctrl+Shift+I` (or `Cmd+Option+I` on macOS).
2. Click on the "WebAuthn" tab. If it's not visible, click on the ">>" icon to find it.
3. Click on "Enable virtual authenticator environment" to create a new authenticator.

- Protocol: CTAP2,
- Transport: usb,
- Supports resident keys: ✅,
- Supports user verification: ✅,
- Support large blox: ❌

5. Once the virtual authenticator is configured, you can use it to register or sign-in via passkeys on the development environment
