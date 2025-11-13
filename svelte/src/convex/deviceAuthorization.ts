import { mutation, query } from './_generated/server';
import { ConvexError, v } from 'convex/values';
import { createAuth } from './auth';
import { APIError } from 'better-auth/api';
import { components } from './_generated/api';

export const requestDeviceCode = mutation({
	args: { clientId: v.string() },
	async handler(ctx, { clientId }) {
		if (clientId != process.env.FIGMA_PLUGIN_CLIENT_ID) {
			throw new ConvexError('Invalid client_id');
		}
		const auth = createAuth(ctx);
		const data = await auth.api.deviceCode({
			body: {
				client_id: clientId,
				scope: 'read:orgs read:themes'
			}
		});
		return data;
	}
});

export const getDeviceCodeStatus = query({
	args: { deviceCode: v.string(), clientId: v.string() },
	async handler(ctx, { deviceCode, clientId }) {
		if (clientId != process.env.FIGMA_PLUGIN_CLIENT_ID) {
			throw new ConvexError('Invalid client_id');
		}
		try {
			const deviceCodeData = await ctx.runQuery(components.betterAuth.auth.deviceCode, {
				deviceCode
			});
			return deviceCodeData?.status ?? 'unknown';
		} catch (error) {
			throw new ConvexError(`${error}`);
		}
	}
});

export const createDeviceToken = mutation({
	args: { deviceCode: v.string(), clientId: v.string() },
	async handler(ctx, { deviceCode, clientId }) {
		if (clientId != process.env.FIGMA_PLUGIN_CLIENT_ID) {
			throw new ConvexError('Invalid client_id');
		}
		const auth = createAuth(ctx);

		try {
			const data = await auth.api.deviceToken({
				body: {
					grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
					device_code: deviceCode,
					client_id: clientId
				}
			});
			return data;
		} catch (error) {
			if (error instanceof APIError) {
				throw new ConvexError(`${error.statusCode} ${error.status} ${error.message}`);
			} else {
				throw new ConvexError(`${error}`);
			}
		}
	}
});
