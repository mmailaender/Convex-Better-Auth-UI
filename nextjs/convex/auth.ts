import GitHub from '@auth/core/providers/github';
import { ConvexCredentials } from '@convex-dev/auth/providers/ConvexCredentials';
import { convexAuth, getAuthUserId } from '@convex-dev/auth/server';
import { internal } from './_generated/api.js';
import { MutationCtx, query } from './_generated/server.js';
import { Id } from './_generated/dataModel.js';
import { Password } from '@convex-dev/auth/providers/Password';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
	providers: [
		GitHub,
		Password({
			profile(params) {
				return {
					email: params.email as string,
					name: params.name as string
				};
			}
		}),
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
					slug: (() => {
						const userName: string = (user as { name?: string })?.name ?? '';
						const sanitizedName: string = userName
							.replace(/[^A-Za-z\s]/g, '') // remove non-alphabetical characters
							.trim()
							.replace(/\s+/g, '-')
							.toLowerCase();
						return sanitizedName
							? `personal-organization-${sanitizedName}`
							: 'personal-organization';
					})()
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

export const activeUser = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}
		const user = await ctx.db.get(userId);
		if (!user) {
			return null;
		}
		return user;
	}
});
