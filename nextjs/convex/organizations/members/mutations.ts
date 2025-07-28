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
		organizationId: v.string(),
		successorMemberId: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) throw new ConvexError('Not authenticated');

		const auth = createAuth(ctx);

		// check if the user is the owner and if yes, check if a successor is provided, and if yes set the success as owner and downgrade the user to admin
		const member = await auth.api.getActiveMember({
			headers: await betterAuthComponent.getHeaders(ctx)
		});
		if (member?.role === 'owner') {
			if (!args.successorMemberId) {
				throw new ConvexError('You must provide a successor to leave the organization');
			}
			await auth.api.updateMemberRole({
				body: {
					organizationId: args.organizationId,
					memberId: args.successorMemberId,
					role: 'owner'
				},
				headers: await betterAuthComponent.getHeaders(ctx)
			});
		}

		// TODO: Throws error as it has problems to set the active organization. Wait for a fix https://github.com/get-convex/better-auth/issues/36
		return await auth.api.leaveOrganization({
			body: {
				organizationId: args.organizationId
			},
			headers: await betterAuthComponent.getHeaders(ctx)
		});
	}
});
