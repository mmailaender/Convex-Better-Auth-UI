import { ConvexError, v } from 'convex/values';
import { query } from './_generated/server';
import { createAuth } from '../auth';
import schema from './schema';
import { withSystemFields } from 'convex-helpers/validators';
import type { GenericCtx } from '@convex-dev/better-auth';
import type { DataModel } from '../_generated/dataModel';

// Export a static instance for Better Auth schema generation
export const auth = createAuth({} as GenericCtx<DataModel>);

export const deviceCode = query({
	args: { deviceCode: v.string() },
	returns: v.union(
		v.object(withSystemFields('deviceCode', schema.tables.deviceCode.validator.fields)),
		v.null()
	),
	async handler(ctx, { deviceCode }) {
		try {
			const deviceCodeData = await ctx.db
				.query('deviceCode')
				.withIndex('deviceCode', (q) => q.eq('deviceCode', deviceCode))
				.first();

			return deviceCodeData;
		} catch (error) {
			throw new ConvexError(`${error}`);
		}
	}
});
