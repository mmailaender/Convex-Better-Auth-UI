import { getAuthUserId, invalidateSessions } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import { action, internalAction, internalMutation, mutation, query } from './_generated/server';
import { api, internal } from './_generated/api.js';

export const isUserExisting = query({
	args: {
		email: v.string()
	},
	handler: async (ctx, args) => {
		const { email } = args;
		const user = await ctx.db
			.query('users')
			.filter((q) => q.eq(q.field('email'), email))
			.first();
		return user !== null;
	}
});

export const getUser = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}
		const user = await ctx.db.get(userId);
		if (!user) {
			return null;
		}

		user.image = user.imageId ? ((await ctx.storage.getUrl(user.imageId)) ?? undefined) : undefined;
		return user;
	}
});

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

export const _downloadAndStoreProfileImage = internalAction({
	args: {
		userId: v.id('users'),
		imageUrl: v.string()
	},
	handler: async (ctx, args) => {
		const { userId, imageUrl } = args;

		// Download the image
		const response = await fetch(imageUrl);
		const image = await response.blob();

		// Store the image in Convex
		const postUrl = await ctx.storage.generateUploadUrl();

		const { storageId } = await fetch(postUrl, {
			method: 'POST',
			headers: { 'Content-Type': image.type },
			body: image
		}).then((res) => res.json());
		await ctx.runMutation(internal.users._updateUser, {
			userId,
			data: {
				imageId: storageId,
				image: null
			}
		});
	}
});

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
					await ctx.runMutation(api.organizations.deleteOrganization, {
						organizationId: membership.organizationId
					});
					// deleteOrganization removes membership records, so nothing more to do here
					continue;
				} else {
					// The organization has other members – abort deletion
					throw new ConvexError(
						'Cannot delete user: you are the owner of an organization that still has other members. Transfer ownership or delete the organization first.'
					);
				}
			}

			// Non-owner or non-sole-owner membership – just remove membership
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

		// 4. Finally delete the user document itself
		return await ctx.db.delete(userId);
	}
});

export const invalidateAndDeleteUser = action({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}
		try {
			await ctx.runMutation(internal.users._deleteUser, { userId });
			await invalidateSessions(ctx, { userId });
		} catch (error) {
			console.error('Error deleting user:', error);
			// Propagate the error to the client so it can be handled (e.g. show toast)
			throw error;
			// (logging moved above for consistency)
		}
	}
});
