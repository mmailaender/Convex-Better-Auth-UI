import { mutation, query } from './_generated/server';
import { ConvexError, v } from 'convex/values';
import { createAuth } from './auth';
import { APIError } from 'better-auth/api';
import { components } from './_generated/api';
import { getBetterAuthFallbackUrl } from './url';

const assertDeviceAuthorizationFallbackUrl = () => {
	if (!getBetterAuthFallbackUrl()) {
		throw new ConvexError(
			'BETTER_AUTH_FALLBACK_URL must be set when device authorization is enabled.'
		);
	}
};

export const requestDeviceCode = mutation({
	// `scope` is the space-separated scope list your device client asks for, if it uses any
	args: { clientId: v.string(), scope: v.optional(v.string()) },
	async handler(ctx, { clientId, scope }) {
		if (clientId != process.env.DEVICE_AUTHORIZATION_CLIENT_ID) {
			throw new ConvexError('Invalid client_id');
		}
    assertDeviceAuthorizationFallbackUrl();
		const auth = createAuth(ctx);
		const data = await auth.api.deviceCode({
			body: {
				client_id: clientId,
				scope
			}
		});
		return data;
	}
});

export const getDeviceCodeStatus = query({
	args: { deviceCode: v.string(), clientId: v.string() },
	async handler(ctx, { deviceCode, clientId }) {
		if (clientId != process.env.DEVICE_AUTHORIZATION_CLIENT_ID) {
			throw new ConvexError('Invalid client_id');
		}
		try {
			const deviceCodeData: { status?: string } | null = await ctx.runQuery(
				components.betterAuth.adapter.findOne,
				{
					model: 'deviceCode',
					where: [{ field: 'deviceCode', operator: 'eq', value: deviceCode }]
				}
			);
			return deviceCodeData?.status ?? 'unknown';
		} catch (error) {
			throw new ConvexError(`${error}`);
		}
	}
});

export const createDeviceToken = mutation({
	args: { deviceCode: v.string(), clientId: v.string() },
	async handler(ctx, { deviceCode, clientId }) {
		if (clientId != process.env.DEVICE_AUTHORIZATION_CLIENT_ID) {
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
