import { convexAdapter } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth';
import { betterAuthComponent } from '../../../../convex/auth';
import { type GenericCtx } from '../../../../convex/_generated/server';

// You'll want to replace this with an environment variable
const siteUrl = 'http://localhost:3000';

export const createAuth = (ctx: GenericCtx) =>
	// Configure your Better Auth instance here
	betterAuth({
		// All auth requests will be proxied through your next.js server
		baseURL: siteUrl,
		database: convexAdapter(ctx, betterAuthComponent),

		user: {
			deleteUser: {
				enabled: true
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
		plugins: [
			// The Convex plugin is required
			convex()
		]
	});
