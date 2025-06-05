import GitHub from '@auth/core/providers/github';
import { ConvexCredentials } from '@convex-dev/auth/providers/ConvexCredentials';
import { convexAuth } from '@convex-dev/auth/server';
import { internal } from './_generated/api.js';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [
		GitHub,
		ConvexCredentials({
			id: 'secret',
			authorize: async (params, ctx) => {
				const secret = params.secret;
				if (process.env.AUTH_E2E_TEST_SECRET && secret === process.env.AUTH_E2E_TEST_SECRET) {
					const user = await ctx.runQuery(internal.tests.getTestUser);
					return { userId: user!._id };
				}
				throw new Error('Invalid secret');
			}
		})
	],

	callbacks: {
		async afterUserCreatedOrUpdated(ctx, args) {
			const { userId } = args;
			const imageUrl = args.profile.image as string;

			const user = await ctx.db.get(userId);

			if (imageUrl && !user.imageId) {
				await ctx.scheduler.runAfter(0, internal.users.downloadAndStoreProfileImage, {
					userId,
					imageUrl
				});
			}
		}
	}
});
