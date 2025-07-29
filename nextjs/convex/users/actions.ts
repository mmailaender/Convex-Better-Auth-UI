import { v } from 'convex/values';
import { action } from '../_generated/server';
import { api } from '../_generated/api.js';
import verifyEmail from '../model/emails/verifyEmail.js';

// TODO: Eventually not more needed if we call the cleanup from onDelete function from better-auth
// /**
//  * Public action that invalidates all auth sessions and deletes the user.
//  */
// export const invalidateAndDeleteUser = action({
// 	handler: async (ctx) => {
// 		const userId = await getAuthUserId(ctx);
// 		if (!userId) {
// 			throw new ConvexError('Not authenticated');
// 		}
// 		try {
// 			await ctx.runMutation(internal.users.mutations._deleteUser, { userId });
// 			await invalidateSessions(ctx, { userId });
// 		} catch (error) {
// 			console.error('Error deleting user:', error);
// 			throw error;
// 		}
// 	}
// });

/**
 * Checks if a user with this email already exists. If yes, returns information about the existing user.
 * If not, verifies the email format and validity using the email verification service.
 */
export const checkEmailAvailabilityAndValidity = action({
	args: {
		email: v.string()
	},
	handler: async (ctx, args) => {
		const { email } = args;

		// First check if user with this email already exists
		const userExists = await ctx.runQuery(api.users.queries.isUserExisting, { email });

		// If user exists, return early with the appropriate information
		if (userExists) {
			return {
				valid: true,
				exists: true,
				email,
				reason: 'User with this email already exists'
			};
		}

		// If user doesn't exist, verify email format and validity
		const verificationResult = await verifyEmail(ctx, email);
		return verificationResult;
	}
});
