import { getAuthUserId, invalidateSessions } from '@convex-dev/auth/server';
import type { Id } from '../_generated/dataModel';
import { ConvexError, v } from 'convex/values';
import { action, internalAction } from '../_generated/server';
import { internal } from '../_generated/api.js';

/**
 * Internal action that downloads a remote profile image and stores it in Convex storage,
 * then patches the user document with the new storage reference.
 */
export const _downloadAndStoreProfileImage = internalAction({
	args: {
		userId: v.id('users'),
		orgId: v.optional(v.id('organizations')),
		imageUrl: v.string()
	},
	handler: async (ctx, args) => {
		const { userId, orgId, imageUrl } = args;

		// Download the image and load it into memory
		const response = await fetch(imageUrl);
		if (!response.ok) {
			throw new ConvexError(`Unable to download image: ${response.status} ${response.statusText}`);
		}

		// Read the image once as an ArrayBuffer so we can create fresh Blobs later
		const arrayBuffer: ArrayBuffer = await response.arrayBuffer();
		const imageType: string = response.headers.get('content-type') ?? 'application/octet-stream';

		/**
		 * Helper that uploads a given Blob to Convex storage and returns the resulting storageId.
		 */
		const uploadBlob = async (blob: Blob): Promise<Id<'_storage'>> => {
			const postUrl = await ctx.storage.generateUploadUrl();
			const { storageId } = await fetch(postUrl, {
				method: 'POST',
				headers: { 'Content-Type': imageType },
				body: blob
			}).then((res) => res.json() as Promise<{ storageId: string }>);
			return storageId as Id<'_storage'>;
		};

		// Upload the profile image
		const imageBlob: Blob = new Blob([arrayBuffer], { type: imageType });
		const imageId: Id<'_storage'> = await uploadBlob(imageBlob);

		await ctx.runMutation(internal.users.mutations._updateUser, {
			userId,
			data: {
				imageId,
				image: null
			}
		});

		if (orgId) {
			const logoBlob: Blob = new Blob([arrayBuffer], { type: imageType });
			const logoId: Id<'_storage'> = await uploadBlob(logoBlob);

			await ctx.runMutation(internal.organizations.mutations._updateOrganizationProfile, {
				organizationId: orgId,
				logoId
			});
		}
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
