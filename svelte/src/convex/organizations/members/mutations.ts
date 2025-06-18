import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import { mutation } from '../../_generated/server';
import {
	updateMemberRoleModel,
	removeMemberModel,
	leaveOrganizationModel
} from '../../model/organizations/members';

/**
 * Update the role of a member in the current active organization
 */
export const updateMemberRole = mutation({
	args: {
		userId: v.id('users'),
		newRole: v.union(v.literal('role_organization_member'), v.literal('role_organization_admin'))
	},
	handler: async (ctx, args) => {
		const actorId = await getAuthUserId(ctx);
		if (!actorId) {
			throw new ConvexError('Not authenticated');
		}

		const actor = await ctx.db.get(actorId);
		if (!actor || !actor.activeOrganizationId) {
			throw new ConvexError('No active organization');
		}

		return updateMemberRoleModel(ctx, {
			actorId,
			organizationId: actor.activeOrganizationId,
			targetUserId: args.userId,
			newRole: args.newRole
		});
	}
});

/**
 * Remove a user from the current active organization
 */
export const removeMember = mutation({
	args: {
		userId: v.id('users')
	},
	handler: async (ctx, args) => {
		const actorId = await getAuthUserId(ctx);
		if (!actorId) throw new ConvexError('Not authenticated');

		return removeMemberModel(ctx, { actorId, targetUserId: args.userId });
	}
});

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
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new ConvexError('Not authenticated');

		return leaveOrganizationModel(ctx, {
			userId,
			organizationId: args.organizationId,
			successorId: args.successorId ?? undefined
		});
	}
});
