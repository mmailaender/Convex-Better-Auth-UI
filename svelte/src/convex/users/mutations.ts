import { mutation } from '../_generated/server';
import { type Id } from '../_generated/dataModel';

import { authComponent, createAuth } from '../auth';

import { ConvexError, v } from 'convex/values';
import { APIError } from 'better-auth/api';

/**
 * Update the authenticated user's avatar storage reference.
 */
export const updateAvatar = mutation({
	args: {
		storageId: v.id('_storage')
	},
	handler: async (ctx, args) => {
		const userId = (await authComponent.safeGetAuthUser(ctx))?.userId as Id<'users'>;
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}

		const user = await ctx.db.get(userId);
		if (!user) {
			throw new ConvexError('User not found');
		}

		if (user.imageId && user.imageId !== args.storageId) {
			await ctx.storage.delete(user.imageId);
		}

		const imageUrl = await ctx.storage.getUrl(args.storageId);

		if (!imageUrl) {
			throw new ConvexError('Failed to get image URL');
		}

		const auth = createAuth(ctx);
		await auth.api.updateUser({
			body: { image: imageUrl },
			headers: await authComponent.getHeaders(ctx)
		});

		await ctx.db.patch(userId, { imageId: args.storageId });

		return imageUrl;
	}
});

// /**
//  * Internal mutation to patch arbitrary user fields.
//  */
// export const _updateUser = internalMutation({
// 	args: {
// 		userId: v.id('users'),
// 		data: v.record(v.string(), v.any())
// 	},
// 	handler: async (ctx, args) => {
// 		const { userId, data } = args;

// 		return await patchUserModel(ctx, { userId, data });
// 	}
// });

// /**
//  * Internal mutation that deletes a user and associated data.
//  */
// export const _deleteUser = internalMutation({
// 	args: {
// 		userId: v.id('users')
// 	},
// 	handler: async (ctx, args) => {
// 		const { userId } = args;
// 		return await deleteUserModel(ctx, { userId });
// 	}
// });

export const setPassword = mutation({
	args: {
		password: v.string()
	},
	handler: async (ctx, args) => {
		const userId = (await authComponent.safeGetAuthUser(ctx))?.userId as Id<'users'>;
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}

		const auth = createAuth(ctx);
		try {
			await auth.api.setPassword({
				body: { newPassword: args.password },
				headers: await authComponent.getHeaders(ctx)
			});
		} catch (error) {
			if (error instanceof APIError) {
				throw new ConvexError(error.message);
			}
			console.error('Unexpected error setting password:', error);
			throw new ConvexError('An unexpected error occurred while setting the password');
		}
	}
});
