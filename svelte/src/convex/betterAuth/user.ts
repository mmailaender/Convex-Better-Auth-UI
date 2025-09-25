import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { partial, withSystemFields } from 'convex-helpers/validators';
import schema from './schema';

/**
 * Get a user by ID without the need to pass an authorized user session. Use rarely. Prefer auth.api.getUser if possible.
 */
export const getUserById = query({
	args: {
		userId: v.id('user')
	},
	returns: v.union(
		v.null(),
		v.object(withSystemFields('user', schema.tables.user.validator.fields))
	),
	handler: async (ctx, args) => {
		return ctx.db.get(args.userId);
	}
});

export const getUserByEmail = query({
	args: {
		email: v.string()
	},
	returns: v.union(
		v.null(),
		v.object(withSystemFields('user', schema.tables.user.validator.fields))
	),
	handler: async (ctx, args) => {
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
	returns: v.null(),
	handler: async (ctx, args) => {
		return ctx.db.patch(args.userId, args.data);
	}
});
