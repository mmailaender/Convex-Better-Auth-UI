import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { partial } from 'convex-helpers/validators';
import schema from './schema';
import { Doc } from './_generated/dataModel';

/**
 * Get a user by ID without the need to pass an authorized user session. Use rarely. Prefer auth.api.getUser if possible.
 */
export const getUserById = query({
	args: {
		userId: v.id('user')
	},
	handler: async (ctx, args) => {
		return ctx.db.get(args.userId);
	}
});

export const getUserByEmail = query({
	args: {
		email: v.string()
	},
	handler: async (ctx, args): Promise<Doc<'user'> | null> => {
		return ctx.db
			.query('user')
			.withIndex('email_name', (q) => q.eq('email', args.email))
			.first();
	}
});

/**
 * Update a user's fields without the need to pass an authorized user session. Use rarely. Prefer auth.api.updateUser if possible.
 */
export const updateUser = mutation({
	args: {
		userId: v.id('user'),
		data: partial(schema.tables.user.validator)
	},
	handler: async (ctx, args) => {
		return ctx.db.patch(args.userId, args.data);
	}
});
