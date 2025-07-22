import { getAuthUserId } from '@convex-dev/auth/server';
// import { isUserExistingModel, getUserModel } from '../model/users';
import { isUserExistingModel } from '../model/users';
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
		return await isUserExistingModel(ctx, args);
	}
});

// /**
//  * Return the currently authenticated user document with populated image URL (if any).
//  */
// export const getUser = query({
// 	handler: async (ctx) => {
// 		const userId = await getAuthUserId(ctx);
// 		if (!userId) {
// 			return null;
// 		}
// 		return await getUserModel(ctx, { userId });
// 	}
// });
