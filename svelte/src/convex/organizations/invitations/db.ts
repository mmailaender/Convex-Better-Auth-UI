import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query, internalMutation } from '../../_generated/server';
import { Id } from '../../_generated/dataModel';

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

		const organizationId: Id<'organizations'> = user.activeOrganizationId;

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
			throw new Error('Not authenticated');
		}

		// Get the invitation
		const invitation = await ctx.db.get(args.invitationId);
		if (!invitation) {
			throw new Error('Invitation not found');
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
			throw new Error('Not authorized to revoke invitations');
		}

		// Delete the invitation
		await ctx.db.delete(args.invitationId);
		return { success: true };
	}
});

/**
 * Creates a new organization invitation
 */
export const createInvitation = internalMutation({
	args: {
		email: v.string(),
		role: v.union(
			v.literal('role_organization_member'),
			v.literal('role_organization_admin'),
			v.literal('role_organization_owner')
		)
	},
	handler: async (ctx, args) => {
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		const { email, role } = args;

		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		// Get the user's active organization
		const user = await ctx.db.get(userId);
		if (!user || !user.activeOrganizationId) {
			throw new Error('User has no active organization');
		}

		const organization = await ctx.db.get(user.activeOrganizationId);
		if (!organization) {
			throw new Error('Organization not found');
		}

		// Check if an invitation is already existing and if yes return the invitation id
		const existingInvitation = await ctx.db
			.query('invitations')
			.withIndex('by_org_and_email', (q) =>
				q.eq('organizationId', organization._id).eq('email', email)
			)
			.first();

		if (existingInvitation) {
			return {
				_id: existingInvitation._id,
				invitedByUserId: userId,
				invitedByName: user.name,
				organizationId: organization._id,
				organizationName: organization.name
			};
		} else {
			// Create the invitation
			const invitationId = await ctx.db.insert('invitations', {
				email,
				role,
				invitedByUserId: userId,
				organizationId: organization._id,
				expiresAt: expiresAt.getTime()
			});

			return {
				_id: invitationId,
				invitedByUserId: userId,
				invitedByName: user.name,
				organizationId: organization._id,
				organizationName: organization.name
			};
		}
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
			throw new Error('Not authenticated');
		}

		// Get the user
		const user = await ctx.db.get(userId);
		if (!user) {
			throw new Error('User not found');
		}

		// Get the invitation
		const invitation = await ctx.db
			.query('invitations')
			.filter((q) => q.eq(q.field('_id'), args.invitationId))
			.first();

		if (!invitation) {
			throw new Error('Invitation not found');
		}

		// Check if invitation has expired
		if (invitation.expiresAt < Date.now()) {
			throw new Error('Invitation has expired');
		}

		// Check if user's email matches the invitation email
		if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
			throw new Error('This invitation was not sent to your email address');
		}

		// Check if the user is already a member of the organization
		const existingMembership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) =>
				q.eq('organizationId', invitation.organizationId).eq('userId', userId)
			)
			.first();

		if (existingMembership) {
			// User is already a member, so delete the invitation
			await ctx.db.delete(invitation._id);

			// Set this organization as the user's active organization
			await ctx.db.patch(userId, {
				activeOrganizationId: invitation.organizationId
			});

			return { success: true };
		}

		// Add the user to the organization with the role from the invitation
		await ctx.db.insert('organizationMembers', {
			organizationId: invitation.organizationId,
			userId: userId,
			role: invitation.role
		});

		// Set this organization as the user's active organization
		await ctx.db.patch(userId, {
			activeOrganizationId: invitation.organizationId
		});

		// Delete the invitation
		await ctx.db.delete(invitation._id);

		return { success: true };
	}
});
