import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import { internalMutation, mutation } from '../_generated/server';
import { patchUserModel, deleteUserModel } from '../model/users';

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

		return await patchUserModel(ctx, { userId, data: { name: args.name } });
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

		return await patchUserModel(ctx, { userId, data: { imageId: args.storageId } });
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

		return await patchUserModel(ctx, { userId, data });
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
		return await deleteUserModel(ctx, { userId });
	}
});
