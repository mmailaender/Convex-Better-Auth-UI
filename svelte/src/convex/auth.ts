import { type AuthFunctions, type GenericCtx, createClient } from '@convex-dev/better-auth';
import { requireActionCtx } from '@convex-dev/better-auth/utils';
import { components, internal } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import authSchema from './betterAuth/schema';
import authConfig from './auth.config';

import { betterAuth, type BetterAuthOptions } from 'better-auth';

// Plugins
import { convex } from '@convex-dev/better-auth/plugins';
import {
	emailOTP,
	magicLink,
	organization,
	apiKey,
	deviceAuthorization
} from 'better-auth/plugins';

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
			onCreate: async (ctx, authUser) => {
				if (AUTH_CONSTANTS.organizations) {
					try {
						await ctx.runMutation(internal.organizations.mutations._createOrganization, {
							userId: authUser._id,
							name: `Personal Organization`,
							slug: (() => {
								const userName: string = (authUser as { name?: string })?.name ?? '';
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
			},
			onDelete: async (ctx, authUser) => {
				if (authUser.imageId) {
					await ctx.storage.delete(authUser.imageId);
				}
				if (AUTH_CONSTANTS.organizations) {
					await ctx.runMutation(components.betterAuth.organization.deleteUser, authUser);
				}
			}
		},
		session: {
			onCreate: async (ctx, session) => {
				if (!session.activeOrganizationId && AUTH_CONSTANTS.organizations) {
					await ctx.runMutation(components.betterAuth.organization.setActiveOrganization, {
						userId: session.userId,
						sessionId: session._id
					});
				}
			}
		}
	}
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
	// Configure your Better Auth instance here
	return {
		// All auth requests will be proxied through your sveltekit server
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),

		emailVerification: {
			autoSignInAfterVerification: true,
			sendOnSignUp: AUTH_CONSTANTS.sendEmails ?? false,
			sendVerificationEmail: async ({ user, url }) => {
				await sendEmailVerification(requireActionCtx(ctx), {
					to: user.email,
					url
				});
			}
		},

		// Simple non-verified email/password to get started
		emailAndPassword: {
			enabled: AUTH_CONSTANTS.providers.password ?? false,
			requireEmailVerification: AUTH_CONSTANTS.sendEmails ?? false,
			sendResetPassword: async ({ user, url }) => {
				await sendResetPassword(requireActionCtx(ctx), {
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
			},
			google: {
				enabled: AUTH_CONSTANTS.providers.google ?? false,
				clientId: process.env.GOOGLE_CLIENT_ID as string,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
			},
			facebook: {
				enabled: AUTH_CONSTANTS.providers.facebook ?? false,
				clientId: process.env.FACEBOOK_CLIENT_ID as string,
				clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string
			},
			apple: {
				enabled: AUTH_CONSTANTS.providers.apple ?? false,
				clientId: process.env.APPLE_CLIENT_ID as string,
				clientSecret: process.env.APPLE_CLIENT_SECRET as string
			},
			atlassian: {
				enabled: AUTH_CONSTANTS.providers.atlassian ?? false,
				clientId: process.env.ATLASSIAN_CLIENT_ID as string,
				clientSecret: process.env.ATLASSIAN_CLIENT_SECRET as string
			},
			discord: {
				enabled: AUTH_CONSTANTS.providers.discord ?? false,
				clientId: process.env.DISCORD_CLIENT_ID as string,
				clientSecret: process.env.DISCORD_CLIENT_SECRET as string
			},
			figma: {
				enabled: AUTH_CONSTANTS.providers.figma ?? false,
				clientId: process.env.FIGMA_CLIENT_ID as string,
				clientSecret: process.env.FIGMA_CLIENT_SECRET as string
			},
			line: {
				enabled: AUTH_CONSTANTS.providers.line ?? false,
				clientId: process.env.LINE_CLIENT_ID as string,
				clientSecret: process.env.LINE_CLIENT_SECRET as string
			},
			huggingface: {
				enabled: AUTH_CONSTANTS.providers.huggingface ?? false,
				clientId: process.env.HUGGINGFACE_CLIENT_ID as string,
				clientSecret: process.env.HUGGINGFACE_CLIENT_SECRET as string
			},
			kakao: {
				enabled: AUTH_CONSTANTS.providers.kakao ?? false,
				clientId: process.env.KAKAO_CLIENT_ID as string,
				clientSecret: process.env.KAKAO_CLIENT_SECRET as string
			},
			kick: {
				enabled: AUTH_CONSTANTS.providers.kick ?? false,
				clientId: process.env.KICK_CLIENT_ID as string,
				clientSecret: process.env.KICK_CLIENT_SECRET as string
			},
			paypal: {
				enabled: AUTH_CONSTANTS.providers.paypal ?? false,
				clientId: process.env.PAYPAL_CLIENT_ID as string,
				clientSecret: process.env.PAYPAL_CLIENT_SECRET as string
			},
			salesforce: {
				enabled: AUTH_CONSTANTS.providers.salesforce ?? false,
				clientId: process.env.SALESFORCE_CLIENT_ID as string,
				clientSecret: process.env.SALESFORCE_CLIENT_SECRET as string
			},
			slack: {
				enabled: AUTH_CONSTANTS.providers.slack ?? false,
				clientId: process.env.SLACK_CLIENT_ID as string,
				clientSecret: process.env.SLACK_CLIENT_SECRET as string
			},
			notion: {
				enabled: AUTH_CONSTANTS.providers.notion ?? false,
				clientId: process.env.NOTION_CLIENT_ID as string,
				clientSecret: process.env.NOTION_CLIENT_SECRET as string
			},
			naver: {
				enabled: AUTH_CONSTANTS.providers.naver ?? false,
				clientId: process.env.NAVER_CLIENT_ID as string,
				clientSecret: process.env.NAVER_CLIENT_SECRET as string
			},
			tiktok: {
				enabled: AUTH_CONSTANTS.providers.tiktok ?? false,
				clientSecret: process.env.TIKTOK_CLIENT_SECRET as string,
				clientKey: process.env.TIKTOK_CLIENT_KEY as string
			},
			twitch: {
				enabled: AUTH_CONSTANTS.providers.twitch ?? false,
				clientId: process.env.TWITCH_CLIENT_ID as string,
				clientSecret: process.env.TWITCH_CLIENT_SECRET as string
			},
			twitter: {
				enabled: AUTH_CONSTANTS.providers.x ?? false,
				clientId: process.env.X_CLIENT_ID as string,
				clientSecret: process.env.X_CLIENT_SECRET as string
			},
			dropbox: {
				enabled: AUTH_CONSTANTS.providers.dropbox ?? false,
				clientId: process.env.DROPBOX_CLIENT_ID as string,
				clientSecret: process.env.DROPBOX_CLIENT_SECRET as string
			},
			linear: {
				enabled: AUTH_CONSTANTS.providers.linear ?? false,
				clientId: process.env.LINEAR_CLIENT_ID as string,
				clientSecret: process.env.LINEAR_CLIENT_SECRET as string
			},
			gitlab: {
				enabled: AUTH_CONSTANTS.providers.gitlab ?? false,
				clientId: process.env.GITLAB_CLIENT_ID as string,
				clientSecret: process.env.GITLAB_CLIENT_SECRET as string
			},
			reddit: {
				enabled: AUTH_CONSTANTS.providers.reddit ?? false,
				clientId: process.env.REDDIT_CLIENT_ID as string,
				clientSecret: process.env.REDDIT_CLIENT_SECRET as string
			},
			roblox: {
				enabled: AUTH_CONSTANTS.providers.roblox ?? false,
				clientId: process.env.ROBLOX_CLIENT_ID as string,
				clientSecret: process.env.ROBLOX_CLIENT_SECRET as string
			},
			spotify: {
				enabled: AUTH_CONSTANTS.providers.spotify ?? false,
				clientId: process.env.SPOTIFY_CLIENT_ID as string,
				clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string
			},
			vk: {
				enabled: AUTH_CONSTANTS.providers.vk ?? false,
				clientId: process.env.VK_CLIENT_ID as string,
				clientSecret: process.env.VK_CLIENT_SECRET as string
			},
			zoom: {
				enabled: AUTH_CONSTANTS.providers.zoom ?? false,
				clientId: process.env.ZOOM_CLIENT_ID as string,
				clientSecret: process.env.ZOOM_CLIENT_SECRET as string
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
					await sendChangeEmailVerification(requireActionCtx(ctx), {
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
			convex({
				authConfig,
				jwksRotateOnTokenGenerationError: true
			}),
			...(AUTH_CONSTANTS.providers.emailOTP
				? [
						emailOTP({
							sendVerificationOTP: async ({ email, otp }) => {
								await sendOTPVerification(requireActionCtx(ctx), {
									to: email,
									code: otp
								});
							}
						})
					]
				: []),
			...(AUTH_CONSTANTS.providers.magicLink
				? [
						magicLink({
							sendMagicLink: async ({ email, url }) => {
								await sendMagicLink(requireActionCtx(ctx), {
									to: email,
									url
								});
							}
						})
					]
				: []),
			...(AUTH_CONSTANTS.organizations
				? [
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
								await sendInviteMember(requireActionCtx(ctx), {
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
				: []),
			...(AUTH_CONSTANTS.apiKeys ? [apiKey()] : []),
			...(AUTH_CONSTANTS.deviceAuthorization
				? [
						deviceAuthorization({
							expiresIn: '7d' // Device code expiration time
						})
					]
				: [])
		]
	} satisfies BetterAuthOptions;
};

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth(createAuthOptions(ctx));
};
