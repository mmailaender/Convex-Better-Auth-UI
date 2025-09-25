import { mutation } from './_generated/server';
import { authComponent } from './auth';

/**
 * Generates a URL for uploading organization logo
 */
export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		await authComponent.getAuthUser(ctx);

		// Generate a URL for the client to upload an image directly to storage
		return await ctx.storage.generateUploadUrl();
	}
});
