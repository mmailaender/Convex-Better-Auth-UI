import { getAuthUserId } from '@convex-dev/auth/server';
import { query } from '../../_generated/server';

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

		// Get all invitations for this organization
		const invitations = await ctx.db
			.query('invitations')
			.withIndex('by_org_and_email', (q) => q.eq('organizationId', organizationId))
			.collect();

		// Get the invited by user info for each invitation
		return await Promise.all(
			invitations.map(async (invitation) => {
				const invitedByUser = await ctx.db.get(invitation.invitedByUserId);

				return {
					_id: invitation._id,
					email: invitation.email,
					role: invitation.role,
					invitedBy: {
						_id: invitedByUser?._id,
						name: invitedByUser?.name || 'Unknown'
					},
					expiresAt: invitation.expiresAt
				};
			})
		);
	}
});
