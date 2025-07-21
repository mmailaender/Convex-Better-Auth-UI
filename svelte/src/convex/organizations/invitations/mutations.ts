import { ConvexError, v } from 'convex/values';
import { internalMutation, mutation } from '../../_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import {
	createInvitationModel,
	revokeInvitationModel,
	acceptInvitationModel
} from '../../model/organizations/invitations';

/**
 * Revokes an invitation
 */
export const revokeInvitation = mutation({
	args: {
		invitationId: v.id('invitations')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}

		// Get the invitation
		const invitation = await ctx.db.get(args.invitationId);
		if (!invitation) {
			throw new ConvexError('Invitation not found');
		}

		// Check if the user is an admin or owner of this organization
		const membership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) =>
				q.eq('organizationId', invitation.organizationId).eq('userId', userId)
			)
			.first();

		if (
			!membership ||
			!['role_organization_owner', 'role_organization_admin'].includes(membership.role)
		) {
			throw new ConvexError('Not authorized to revoke invitations');
		}

		// Business logic in model
		await revokeInvitationModel(ctx, { invitationId: args.invitationId });
		return { success: true };
	}
});

/**
 * Creates a new organization invitation
 */
export const _createInvitation = internalMutation({
	args: {
		email: v.string(),
		role: v.union(
			v.literal('role_organization_member'),
			v.literal('role_organization_admin'),
			v.literal('role_organization_owner')
		)
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new ConvexError('Not authenticated');
		return await createInvitationModel(ctx, { userId, email: args.email, role: args.role });
	}
});

/**
 * Accepts an organization invitation
 *
 * This mutation is called by the HTTP action when a user clicks on the
 * invitation acceptance link in their email. It adds the user to the
 * organization with the specified role, sets it as their active organization,
 * and deletes the invitation.
 */
export const acceptInvitation = mutation({
	args: {
		invitationId: v.string()
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}

		await acceptInvitationModel(ctx, { userId, invitationId: args.invitationId });
		return { success: true };
	}
});
