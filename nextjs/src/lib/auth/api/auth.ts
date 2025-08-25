import { convexAdapter } from '@convex-dev/better-auth';
import { betterAuth } from 'better-auth';
import { betterAuthComponent } from '../../../../convex/auth';
import { type GenericCtx } from '../../../../convex/_generated/server';
import { components } from '../../../../convex/_generated/api';

// Emails
import {
	sendEmailVerification,
	sendInviteMember,
	sendMagicLink,
	sendOTPVerification,
	sendResetPassword,
	sendChangeEmailVerification
} from '../../../../convex/email';
// Plugins
import { convex } from '@convex-dev/better-auth/plugins';
import { emailOTP, magicLink, organization } from 'better-auth/plugins';

import { requireMutationCtx } from '@convex-dev/better-auth/utils';
import { AUTH_CONSTANTS } from '../../../../convex/auth.constants';
import { internal } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

const siteUrl = process.env.SITE_URL;

export const createAuth = (ctx: GenericCtx) =>
	// Configure your Better Auth instance here
	betterAuth({
		// All auth requests will be proxied through your next.js server
		baseURL: siteUrl,
		database: convexAdapter(ctx, betterAuthComponent),

		emailVerification: {
			autoSignInAfterVerification: true,
			sendOnSignUp: true,
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
			requireEmailVerification: true,
			sendResetPassword: async ({ user, url }) => {
				await sendResetPassword(requireMutationCtx(ctx), {
					to: user.email,
					url
				});
			}
		},
		socialProviders: {
			github: {
				enabled: true,
				clientId: process.env.GITHUB_CLIENT_ID as string,
				clientSecret: process.env.GITHUB_CLIENT_SECRET as string
			}
		},
		account: {
			accountLinking: {
				allowDifferentEmails: true
			}
		},

		user: {
			deleteUser: {
				enabled: true
			},
			changeEmail: {
				enabled: true,
				sendChangeEmailVerification: async ({ user, newEmail, url }) => {
					await sendChangeEmailVerification(requireMutationCtx(ctx), {
						to: user.email,
						url,
						newEmail,
						userName: user.name
					});
				}
			}
		},

		plugins: [
			// The Convex plugin is required
			convex(),
			emailOTP({
				sendVerificationOTP: async ({ email, otp }) => {
					await sendOTPVerification(requireMutationCtx(ctx), {
						to: email,
						code: otp
					});
				}
			}),
			magicLink({
				sendMagicLink: async ({ email, url }) => {
					await sendMagicLink(requireMutationCtx(ctx), {
						to: email,
						url
					});
				}
			}),
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
		],
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						if ('runMutation' in ctx) {
							if (AUTH_CONSTANTS.organizations) {
								const auth = createAuth(ctx);
								try {
									const userWithUserId = (await ctx.runQuery(components.betterAuth.lib.findOne, {
										model: 'user',
										where: [{ field: 'email', operator: 'eq', value: user.email }]
									})) as typeof auth.$Infer.Session.user;

									await ctx.runMutation(internal.organizations.mutations._createOrganization, {
										userId: userWithUserId.userId as Id<'users'>,
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
										})(),
										skipActiveOrganization: true
									});
								} catch (error) {
									console.error('Error creating organization:', error);
								}
							}
						}
					}
				}
			}
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
		}
	});
