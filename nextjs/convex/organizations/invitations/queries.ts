import { query } from '../../_generated/server';
import { betterAuthComponent } from '../../auth';
import { createAuth } from '../../../src/components/auth/api/auth';

/**
 * Get pending invitations for the current active organization
 */
export const listInvitations = query({
	handler: async (ctx) => {
		const auth = createAuth(ctx);
		try {
			return await auth.api.listInvitations({
				headers: await betterAuthComponent.getHeaders(ctx)
			});
		} catch {
			return [];
		}
	}
});
