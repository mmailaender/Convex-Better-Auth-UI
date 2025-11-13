import { createAuthClient } from 'better-auth/svelte';
import { convexClient } from '@convex-dev/better-auth/client/plugins';
import {
	emailOTPClient,
	organizationClient,
	magicLinkClient,
	apiKeyClient
} from 'better-auth/client/plugins';

import { AUTH_CONSTANTS } from '$convex/auth.constants';

export const authClient = createAuthClient({
	plugins: [
		convexClient(),
		...(AUTH_CONSTANTS.organizations ? [organizationClient()] : []),
		...(AUTH_CONSTANTS.providers.emailOTP ? [emailOTPClient()] : []),
		...(AUTH_CONSTANTS.providers.magicLink ? [magicLinkClient()] : []),
		...(AUTH_CONSTANTS.apiKeys ? [apiKeyClient()] : [])
	]
});
