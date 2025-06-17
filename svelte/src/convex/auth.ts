import GitHub from '@auth/core/providers/github';
import { ConvexCredentials } from '@convex-dev/auth/providers/ConvexCredentials';
import { convexAuth } from '@convex-dev/auth/server';
import { api, internal } from './_generated/api.js';
import { MutationCtx } from './_generated/server.js';

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
		async afterUserCreatedOrUpdated(ctx: MutationCtx, args) {
			const { userId } = args;
			const imageUrl = args.profile.image as string;

			const user = await ctx.db.get(userId);

			if (imageUrl && !user?.imageId) {
				await ctx.scheduler.runAfter(0, internal.users._downloadAndStoreProfileImage, {
					userId,
					imageUrl
				});
			}

			// Get the user's organizations. If there is no organization create one with the users name
			const organizations = await ctx.db
				.query('organizationMembers')
				.withIndex('userId', (q) => q.eq('userId', userId))
				.collect();

			if (organizations.length === 0) {
				await ctx.runMutation(internal.organizations._createOrganization, {
					userId,
					name: user?.name + "'s projects",
					slug: user?.name + '-projects',
					logoId: user?.imageId
				});
			}
		}
	}
});
