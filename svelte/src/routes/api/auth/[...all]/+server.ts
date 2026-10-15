import { createSvelteKitHandler } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { PUBLIC_CONVEX_SITE_URL } from '$app/env/public';

// Passed explicitly: the site URL can't be derived for custom domains, self-hosted or local deployments
export const { GET, POST } = createSvelteKitHandler({ convexSiteUrl: PUBLIC_CONVEX_SITE_URL });
