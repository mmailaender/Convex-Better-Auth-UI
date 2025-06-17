import { getAuthUserId, invalidateSessions } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import { action, ActionCtx, internalAction } from '../_generated/server';
import { internal } from '../_generated/api.js';

/**
 * Internal action that downloads a remote profile image and stores it in Convex storage,
 * then patches the user document with the new storage reference.
 */
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

		await ctx.runMutation(internal.users.mutations._updateUser, {
			userId,
			data: {
				imageId: storageId,
				image: null
			}
		});
	}
});

/**
 * Public action that invalidates all auth sessions and deletes the user.
 */
export const invalidateAndDeleteUser = action({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}
		try {
			await ctx.runMutation(internal.users.mutations._deleteUser, { userId });
			await invalidateSessions(ctx, { userId });
		} catch (error) {
			console.error('Error deleting user:', error);
			throw error;
		}
	}
});
