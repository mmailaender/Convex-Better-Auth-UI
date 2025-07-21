import { getAuthUserId } from '@convex-dev/auth/server';
import { query } from '../../_generated/server';
import { getInvitationsModel } from '../../model/organizations/invitations';

/**
 * Get pending invitations for the current active organization
 */
export const getInvitations = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		// Get the user's active organization
		const user = await ctx.db.get(userId);
		if (!user || !user.activeOrganizationId) {
			return [];
		}

		const organizationId = user.activeOrganizationId;

		// Check if the user is an admin or owner
		const membership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) =>
				q.eq('organizationId', organizationId).eq('userId', userId)
			)
			.first();

		if (
			!membership ||
			!['role_organization_owner', 'role_organization_admin'].includes(membership.role)
		) {
			// Not authorized to view invitations
			return [];
		}

		// Fetch invitations via model
		return await getInvitationsModel(ctx, { organizationId });
	}
});
