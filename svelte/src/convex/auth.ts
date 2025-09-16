import { type AuthFunctions, type GenericCtx, createClient } from '@convex-dev/better-auth';
import { requireMutationCtx } from '@convex-dev/better-auth/utils';
import { components, internal } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import authSchema from './betterAuth/schema';

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
export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
	local: {
		schema: authSchema
	},
	authFunctions,
	triggers: {
		user: {
			onDelete: async (ctx, authUser) => {
				await ctx.runMutation(components.betterAuth.user.deleteUser, authUser);
			}
		}
	}
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuth = (ctx: GenericCtx<DataModel>, { optionsOnly } = { optionsOnly: false }) =>
	// Configure your Better Auth instance here
	betterAuth({
		logger: {
			disabled: optionsOnly
		},
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
			additionalFields: {
				imageId: {
					type: 'string',
					required: false
				},
				activeOrganizationId: {
					type: 'string',
					required: false
				}
			},
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
								try {
									await ctx.runMutation(internal.organizations.mutations._createOrganization, {
										userId: user.id,
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
		}
	});
