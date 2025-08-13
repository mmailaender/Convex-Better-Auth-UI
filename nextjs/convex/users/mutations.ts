import { mutation } from '../_generated/server';
import { type Id } from '../_generated/dataModel';

import { betterAuthComponent } from '../auth';
import { createAuth } from '../../src/components/auth/api/auth';

import { ConvexError, v } from 'convex/values';
import { APIError } from 'better-auth/api';

import { updateAvatarModel } from '../model/users';

/**
 * Update the authenticated user's avatar storage reference.
 */
export const updateAvatar = mutation({
	args: {
		storageId: v.id('_storage')
	},
	handler: async (ctx, args) => {
		const userId = (await betterAuthComponent.getAuthUserId(ctx)) as Id<'users'>;
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}

		return updateAvatarModel(ctx, { userId, storageId: args.storageId });
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
		const userId = (await betterAuthComponent.getAuthUserId(ctx)) as Id<'users'>;
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}

		const auth = createAuth(ctx);
		try {
			await auth.api.setPassword({
				body: { newPassword: args.password },
				headers: await betterAuthComponent.getHeaders(ctx)
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
