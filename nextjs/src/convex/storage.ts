import { mutation } from './_generated/server';
import { betterAuthComponent } from './auth';

/**
 * Generates a URL for uploading organization logo
 */
export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		// Generate a URL for the client to upload an image directly to storage
		return await ctx.storage.generateUploadUrl();
	}
});
