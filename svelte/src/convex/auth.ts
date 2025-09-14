import { type AuthFunctions, type GenericCtx, createClient } from '@convex-dev/better-auth';
import { requireMutationCtx } from '@convex-dev/better-auth/utils';
import { components, internal } from './_generated/api';
import type { Id, DataModel } from './_generated/dataModel';

import { betterAuth } from 'better-auth';

// Plugins
import { convex } from '@convex-dev/better-auth/plugins';
import { emailOTP, magicLink, organization } from 'better-auth/plugins';

// Emails
import {
	sendEmailVerification,
	sendInviteMember,
	sendMagicLink,
	sendOTPVerification,
	sendResetPassword,
	sendChangeEmailVerification
} from './email';

// Constants
import { AUTH_CONSTANTS } from './auth.constants';
const siteUrl = process.env.SITE_URL;

// Typesafe way to pass Convex functions defined in this file
const authFunctions: AuthFunctions = internal.auth;

// Initialize the component
export const authComponent = createClient<DataModel>(components.betterAuth, {
	authFunctions,
	triggers: {
		user: {
			onCreate: async (ctx, authUser) => {
				// Any `onCreateUser` logic should be moved here
				const userId = await ctx.db.insert('users', {});
				// Instead of returning the user id, we set it to the component
				// user table manually. This is no longer required behavior, but
				// is necessary when migrating from previous versions to avoid
				// a required database migration.
				// This helper method exists solely to facilitate this migration.
				await authComponent.setUserId(ctx, authUser._id, userId);
			},
			onUpdate: async (ctx, oldUser, newUser) => {
				// Any `onUpdateUser` logic should be moved here
			},
			onDelete: async (ctx, authUser) => {
				await ctx.db.delete(authUser.userId as Id<'users'>);
			}
		}
	}
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuth = (ctx: GenericCtx<DataModel>) =>
	// Configure your Better Auth instance here
	betterAuth({
		// All auth requests will be proxied through your next.js server
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),

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
			enabled: AUTH_CONSTANTS.providers.password ?? false,
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
				enabled: AUTH_CONSTANTS.providers.github ?? false,
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
								type AuthInstance = ReturnType<typeof createAuth>;
								try {
									const userWithUserId = (await ctx.runQuery(components.betterAuth.lib.findOne, {
										model: 'user',
										where: [{ field: 'email', operator: 'eq', value: user.email }]
									})) as AuthInstance['$Infer']['Session']['user'];

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
			// }
		}
	});
