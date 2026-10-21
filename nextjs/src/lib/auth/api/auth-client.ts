import { createAuthClient } from 'better-auth/react';
import { convexClient } from '@convex-dev/better-auth/client/plugins';
import {
	adminClient,
	deviceAuthorizationClient,
	emailOTPClient,
	magicLinkClient,
	organizationClient
} from 'better-auth/client/plugins';
import { apiKeyClient } from '@better-auth/api-key/client';

import { AUTH_CONSTANTS } from '@/convex/auth.constants';

export const authClient = createAuthClient({
	plugins: [
		convexClient(),
		...(AUTH_CONSTANTS.organizations ? [organizationClient()] : []),
		...(AUTH_CONSTANTS.providers.emailOTP ? [emailOTPClient()] : []),
		...(AUTH_CONSTANTS.providers.magicLink ? [magicLinkClient()] : []),
		...(AUTH_CONSTANTS.apiKeys ? [apiKeyClient()] : []),
		...(AUTH_CONSTANTS.deviceAuthorization ? [deviceAuthorizationClient()] : []),
		...(AUTH_CONSTANTS.admin ? [adminClient()] : [])
	]
});
