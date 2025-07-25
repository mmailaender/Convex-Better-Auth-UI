import { ConvexError, v } from 'convex/values';
import { mutation } from '../../_generated/server';
import { betterAuthComponent } from '../../auth';
import { createAuth } from '../../../src/components/auth/lib/auth';

/**
 * Leave the current active organization
 * If the user is the owner, a successor must be provided
 */
export const leaveOrganization = mutation({
	args: {
		organizationId: v.id('organizations'),
		successorId: v.optional(v.id('users'))
	},
	handler: async (ctx, args) => {
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) throw new ConvexError('Not authenticated');

		const auth = createAuth(ctx);

		return await auth.api.leaveOrganization({
			body: {
				organizationId: args.organizationId
			},
			headers: await betterAuthComponent.getHeaders(ctx)
		});
	}
});
