import { getAuthUserId } from '@convex-dev/auth/server';
import { query } from '../../_generated/server';
import { v } from 'convex/values';

/**
 * Get all members of the current active organization
 */
export const getOrganizationMembers = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		// Get user to find active organization
		const user = await ctx.db.get(userId);
		if (!user || !user.activeOrganizationId) {
			return [];
		}

		const organizationId = user.activeOrganizationId;

		// Get all members of the active organization
		const memberships = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId', (q) => q.eq('organizationId', organizationId))
			.collect();

		// Get detailed info for each member
		const membersWithDetails = await Promise.all(
			memberships.map(async (membership) => {
				const memberUser = await ctx.db.get(membership.userId);
				// Skip members whose user record doesn't exist
				if (!memberUser) {
					return undefined;
				}

				if (memberUser.imageId) {
					memberUser.image = (await ctx.storage.getUrl(memberUser.imageId)) || undefined;
				}

				return {
					_id: membership._id,
					user: {
						_id: memberUser._id,
						name: memberUser.name,
						email: memberUser.email,
						image: memberUser.image
					},
					role: membership.role
				};
			})
		);

		// Filter out null values and return
		return membersWithDetails.filter((member) => member !== undefined);
	}
});

/**
 * Check if the current user is an admin or owner of the specified organization
 */
export const isOwnerOrAdmin = query({
	args: {
		organizationId: v.id('organizations')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return false;
		}

		// Get the membership
		const membership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) =>
				q.eq('organizationId', args.organizationId).eq('userId', userId)
			)
			.first();

		return (
			!!membership &&
			['role_organization_owner', 'role_organization_admin'].includes(membership.role)
		);
	}
});
