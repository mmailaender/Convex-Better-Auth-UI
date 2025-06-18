import GitHub from '@auth/core/providers/github';
import { ConvexCredentials } from '@convex-dev/auth/providers/ConvexCredentials';
import { convexAuth } from '@convex-dev/auth/server';
import { internal } from './_generated/api.js';
import { MutationCtx } from './_generated/server.js';
import { Id } from './_generated/dataModel.js';

import { getUserFirstName } from './model/users/index.js';

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

			// Get the user's organizations. If there is no organization create one with the users name
			const organizations = await ctx.db
				.query('organizationMembers')
				.withIndex('userId', (q) => q.eq('userId', userId))
				.collect();

			let orgId: Id<'organizations'> | undefined;
			if (organizations.length === 0) {
				orgId = await ctx.runMutation(internal.organizations.mutations._createOrganization, {
					userId,
					name: `Personal Organization`,
					slug: `personal-organization`
				});
			}

			if (imageUrl && !user?.imageId) {
				await ctx.scheduler.runAfter(0, internal.users.actions._downloadAndStoreProfileImage, {
					userId,
					orgId,
					imageUrl
				});
			}
		}
	}
});
