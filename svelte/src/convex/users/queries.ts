import { getAuthUserId } from '@convex-dev/auth/server';
import { query } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Check if a user with the given email exists.
 */
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

/**
 * Return the currently authenticated user document with populated image URL (if any).
 */
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
