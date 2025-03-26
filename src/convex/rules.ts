import { addEntRules } from 'convex-ents';
import { entDefinitions } from './schema';
import { QueryCtx } from './types';
import { Id } from './_generated/dataModel';

export function getEntDefinitionsWithRules(ctx: QueryCtx): typeof entDefinitions {
	return addEntRules(entDefinitions, {
		// "users" is one of our tables
		users: {
			read: async (user) => {
				// Example: Only the viewer can see their data
				const viewer = await ctx.viewer();
				return viewer?._id === user._id;
			}
		}
	});
}

// Retrieve viewer ID using ctx.auth
export async function getViewerId(
	ctx: Omit<QueryCtx, 'table' | 'viewerId' | 'viewer' | 'viewerX'>
): Promise<Id<'users'> | null> {
	const user = await ctx.auth.getUserIdentity();
	if (user === null) {
		return null;
	}
	const viewer = await ctx.skipRules.table('users').get(user.subject as Id<'users'>);
	return viewer?._id ?? null;
}
