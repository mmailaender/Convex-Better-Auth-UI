import { query } from '../../_generated/server';
import { authComponent } from '../../auth';
import { createAuth } from '../../auth';

/**
 * Get pending invitations for the current active organization
 */
export const listInvitations = query({
	args: {},
	handler: async (ctx) => {
		const auth = createAuth(ctx);
		try {
			return await auth.api.listInvitations({
				headers: await authComponent.getHeaders(ctx)
			});
		} catch {
			return [];
		}
	}
});
