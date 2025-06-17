import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import { internalMutation, mutation } from '../_generated/server';
import { api } from '../_generated/api.js';

/**
 * Update the authenticated user's display name.
 */
export const updateUserName = mutation({
	args: {
		name: v.string()
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}

		return await ctx.db.patch(userId, {
			name: args.name
		});
	}
});

/**
 * Update the authenticated user's avatar storage reference.
 */
export const updateAvatar = mutation({
	args: {
		storageId: v.id('_storage')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}

		// Update the user's avatar
		return await ctx.db.patch(userId, {
			imageId: args.storageId
		});
	}
});

/**
 * Internal mutation to patch arbitrary user fields.
 */
export const _updateUser = internalMutation({
	args: {
		userId: v.id('users'),
		data: v.record(v.string(), v.any())
	},
	handler: async (ctx, args) => {
		const { userId, data } = args;

		// Convert null values to undefined
		const patchData = Object.fromEntries(
			Object.entries(data).map(([key, value]) => [key, value === null ? undefined : value])
		);
		return await ctx.db.patch(userId, patchData);
	}
});

/**
 * Internal mutation that deletes a user and associated data.
 */
export const _deleteUser = internalMutation({
	args: {
		userId: v.id('users')
	},
	handler: async (ctx, args) => {
		const { userId } = args;

		// 1. The user must leave or delete all organizations before account deletion
		const memberships = await ctx.db
			.query('organizationMembers')
			.withIndex('userId', (q) => q.eq('userId', userId))
			.collect();

		for (const membership of memberships) {
			// Determine how many members the organization has
			const orgMembers = await ctx.db
				.query('organizationMembers')
				.withIndex('orgId', (q) => q.eq('organizationId', membership.organizationId))
				.collect();

			const isOwner: boolean = membership.role === 'role_organization_owner';
			const isOnlyMember: boolean = orgMembers.length === 1;

			if (isOwner) {
				if (isOnlyMember) {
					// Sole owner and sole member -> delete organization entirely
					await ctx.runMutation(api.organizations.mutations.deleteOrganization, {
						organizationId: membership.organizationId
					});
					continue;
				} else {
					throw new ConvexError(
						'Cannot delete user: you are the owner of an organization that still has other members. Transfer ownership or delete the organization first.'
					);
				}
			}

			// Non-owner membership – just remove membership
			await ctx.db.delete(membership._id);
		}

		// 2. Delete all linked authentication provider accounts
		const authAccounts = await ctx.db
			.query('authAccounts')
			.filter((q) => q.eq(q.field('userId'), userId))
			.collect();

		for (const account of authAccounts) {
			await ctx.db.delete(account._id);
		}

		// 3. Remove profile image from storage if present
		const user = await ctx.db.get(userId);
		if (user?.imageId) {
			await ctx.storage.delete(user.imageId);
		}

		// 4. Delete user document
		return await ctx.db.delete(userId);
	}
});
