import { convexAdapter } from '@convex-dev/better-auth';
import { betterAuth } from 'better-auth';
import { betterAuthComponent } from '../../../../convex/auth';
import { type GenericCtx } from '../../../../convex/_generated/server';

// Emails
import { sendEmailVerification, sendInviteMember } from '../../../../convex/email';
// Plugins
import { convex } from '@convex-dev/better-auth/plugins';
import { requireMutationCtx } from '@convex-dev/better-auth/utils';
import { organization } from 'better-auth/plugins';
// import { api, internal } from '../../../../convex/_generated/api';
// import { Id } from '@/convex/_generated/dataModel';

// TODO: You'll want to replace this with an environment variable
const siteUrl = 'http://localhost:3000';

export const createAuth = (ctx: GenericCtx) =>
	// Configure your Better Auth instance here
	betterAuth({
		// All auth requests will be proxied through your next.js server
		baseURL: siteUrl,
		database: convexAdapter(ctx, betterAuthComponent),

		emailVerification: {
			sendVerificationEmail: async ({ user, url }) => {
				await sendEmailVerification(requireMutationCtx(ctx), {
					to: user.email,
					url
				});
			}
		},

		// Simple non-verified email/password to get started
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false
		},
		socialProviders: {
			github: {
				enabled: true,
				clientId: process.env.GITHUB_CLIENT_ID as string,
				clientSecret: process.env.GITHUB_CLIENT_SECRET as string
			}
		},

		user: {
			deleteUser: {
				enabled: true
			}
		},

		plugins: [
			// The Convex plugin is required
			convex(),
			organization({
				schema: {
					organization: {
						additionalFields: {
							logoId: {
								type: 'string',
								required: false
							}
						}
					}
				},
				sendInvitationEmail: async (data) => {
					await sendInviteMember(requireMutationCtx(ctx), {
						to: data.email,
						url: `${siteUrl}/api/organization/accept-invitation/${data.id}`,
						inviter: {
							name: data.inviter.user.name,
							email: data.inviter.user.email,
							image: data.inviter.user.image ?? undefined
						},
						organization: {
							name: data.organization.name,
							logo: data.organization.logo ?? undefined
						}
					});
				}
			})
		]
		// databaseHooks: {
		// 	session: {
		// 		create: {
		// 			before: async (session) => {
		// 				if ('runQuery' in ctx) {
		// 					try {
		// 						const activeOrganizationId = await ctx.runQuery(
		// 							internal.organizations.queries._getActiveOrganizationFromDb,
		// 							{ userId: session.userId as Id<'users'> }
		// 						);

		// 						return {
		// 							data: {
		// 								...session,
		// 								activeOrganizationId: activeOrganizationId || null
		// 							}
		// 						};
		// 					} catch (error) {
		// 						console.error('Error setting active organization:', error);
		// 						return { data: session };
		// 					}
		// 				}
		// 				return { data: session };
		// 			}
		// 		}
		// 	}
		// }
	});
