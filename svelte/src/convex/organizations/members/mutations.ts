import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import { mutation } from '../../_generated/server';
import { Id } from '../../_generated/dataModel';

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

		// Prevent users from changing their own role
		if (actorId.toString() === args.userId.toString()) {
			throw new ConvexError('Cannot change your own role');
		}

		// Get user to find active organization
		const actor = await ctx.db.get(actorId);
		if (!actor || !actor.activeOrganizationId) {
			throw new ConvexError('No active organization');
		}

		const organizationId = actor.activeOrganizationId;

		// Check if the actor has permission (admin or owner)
		const actorMembership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) =>
				q.eq('organizationId', organizationId).eq('userId', actorId)
			)
			.first();

		if (!actorMembership) {
			throw new ConvexError('Not a member of this organization');
		}

		if (!['role_organization_owner', 'role_organization_admin'].includes(actorMembership.role)) {
			throw new ConvexError('Insufficient permissions to update member roles');
		}

		// Find the target user's membership
		const targetMembership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) =>
				q.eq('organizationId', organizationId).eq('userId', args.userId)
			)
			.first();

		if (!targetMembership) {
			throw new ConvexError('Target user is not a member of this organization');
		}

		if (targetMembership.role === 'role_organization_owner') {
			throw new ConvexError('Cannot change the role of an organization owner');
		}

		// Update the membership
		await ctx.db.patch(targetMembership._id, {
			role: args.newRole
		});

		return true;
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
		if (!actorId) {
			throw new ConvexError('Not authenticated');
		}

		// Get user to find active organization
		const actor = await ctx.db.get(actorId);
		if (!actor || !actor.activeOrganizationId) {
			throw new ConvexError('No active organization');
		}

		const organizationId = actor.activeOrganizationId;

		// Check if the actor has permission (admin or owner)
		const actorMembership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) =>
				q.eq('organizationId', organizationId).eq('userId', actorId)
			)
			.first();

		if (!actorMembership) {
			throw new ConvexError('Not a member of this organization');
		}

		if (!['role_organization_owner', 'role_organization_admin'].includes(actorMembership.role)) {
			throw new ConvexError('Insufficient permissions to remove members');
		}

		// Find the target user's membership
		const targetMembership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) =>
				q.eq('organizationId', organizationId).eq('userId', args.userId)
			)
			.first();

		if (!targetMembership) {
			throw new ConvexError('Target user is not a member of this organization');
		}

		// Cannot remove the organization owner
		if (targetMembership.role === 'role_organization_owner') {
			throw new ConvexError('Cannot remove an organization owner');
		}

		// Remove the membership
		await ctx.db.delete(targetMembership._id);

		return true;
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
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}

		// Get the membership
		const membership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) =>
				q.eq('organizationId', args.organizationId).eq('userId', userId)
			)
			.first();

		if (!membership) {
			throw new ConvexError('Not a member of this organization');
		}

		// Check if user is the owner
		if (membership.role === 'role_organization_owner') {
			// Owner must provide a successor
			if (!args.successorId) {
				throw new ConvexError(
					'As the organization owner, you must select a successor before leaving'
				);
			}

			// Get the successor's membership
			const successorMembership = await ctx.db
				.query('organizationMembers')
				.withIndex('orgId_and_userId', (q) =>
					q.eq('organizationId', args.organizationId).eq('userId', args.successorId as Id<'users'>)
				)
				.first();

			if (!successorMembership) {
				throw new ConvexError('Selected successor is not a member of this organization');
			}

			// Update successor's role to owner
			await ctx.db.patch(successorMembership._id, {
				role: 'role_organization_owner'
			});
		}

		// Remove the user's membership
		await ctx.db.delete(membership._id);

		// If this was the user's active organization, unset it
		const user = await ctx.db.get(userId);
		if (user && user.activeOrganizationId === args.organizationId) {
			// Find another organization to set as active
			const otherMemberships = await ctx.db
				.query('organizationMembers')
				.withIndex('userId', (q) => q.eq('userId', userId))
				.collect();

			if (otherMemberships.length > 0) {
				await ctx.db.patch(userId, {
					activeOrganizationId: otherMemberships[0].organizationId
				});
			} else {
				await ctx.db.patch(userId, {
					activeOrganizationId: undefined
				});
			}
		}

		return true;
	}
});
