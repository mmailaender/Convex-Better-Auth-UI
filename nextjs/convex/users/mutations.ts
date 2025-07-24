import { ConvexError, v } from 'convex/values';
import { mutation } from '../_generated/server';
import { updateAvatarModel } from '../model/users';
import { betterAuthComponent } from '../auth';
import { Id } from '../_generated/dataModel';

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
