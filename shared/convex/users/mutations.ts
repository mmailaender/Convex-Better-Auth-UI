import { mutation } from '../_generated/server';
import { components } from '../_generated/api';
import { authComponent, createAuth } from '../auth';

import { ConvexError, v } from 'convex/values';
import { APIError } from 'better-auth/api';

/**
 * Update the authenticated user's profile fields.
 */
export const updateProfile = mutation({
	args: {
		name: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			throw new ConvexError('Not authenticated');
		}

		const updateData: { name?: string } = {};
		if (args.name !== undefined) {
			const name = args.name.trim();
			if (!name) {
				throw new ConvexError('Name cannot be empty');
			}
			updateData.name = name;
		}

		if (Object.keys(updateData).length === 0) return;

		const auth = createAuth(ctx);
		try {
			await auth.api.updateUser({
				body: updateData,
				headers: await authComponent.getHeaders(ctx)
			});
		} catch (error) {
			if (error instanceof APIError) {
				throw new ConvexError(`${error.statusCode} ${error.status} ${error.message}`);
			}
			throw error;
		}
	}
});

/**
 * Update the authenticated user's avatar storage reference.
 */
export const updateAvatar = mutation({
	args: {
		storageId: v.id('_storage'),
		optimisticImage: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			throw new ConvexError('Not authenticated');
		}

		// Delete old image if it exists and is different from the new one
		if (user.imageId && user.imageId !== args.storageId) {
			await ctx.storage.delete(user.imageId);
		}

		const imageUrl = await ctx.storage.getUrl(args.storageId);
		if (!imageUrl) {
			throw new ConvexError('Failed to get image URL');
		}

		// `imageId` is server-only (`input: false`), so the avatar is written through the component
		await ctx.runMutation(components.betterAuth.user.updateUser, {
			userId: user._id,
			data: { image: imageUrl, imageId: args.storageId, updatedAt: Date.now() }
		});

		return imageUrl;
	}
});

export const setPassword = mutation({
	args: {
		password: v.string()
	},
	handler: async (ctx, args) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
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
				throw new ConvexError(`${error.statusCode} ${error.status} ${error.message}`);
			}
			console.error('Unexpected error setting password:', error);
			throw new ConvexError('An unexpected error occurred while setting the password');
		}
	}
});

/**
 * Deletes the authenticated user and all associated data.
 */
export const deleteUser = mutation({
	args: {
		callbackURL: v.optional(v.string()),
		password: v.optional(v.string()),
		token: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		await authComponent.getAuthUser(ctx);

		const auth = createAuth(ctx);
		return await auth.api.deleteUser({
			body: {
				callbackURL: args.callbackURL,
				password: args.password,
				token: args.token
			},
			headers: await authComponent.getHeaders(ctx)
		});
	}
});
