import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { withSystemFields } from 'convex-helpers/validators';
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
		return ctx.db.get('user', args.userId);
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
		data: schema.tables.user.validator.partial()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		return ctx.db.patch('user', args.userId, args.data);
	}
});

/**
 * Delete the API keys of a user or organization (their `referenceId`). Better Auth
 * leaves them behind when it deletes their owner, and they keep verifying.
 */
export const deleteApiKeys = mutation({
	args: { referenceId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const keys = ctx.db
			.query('apikey')
			.withIndex('referenceId', (q) => q.eq('referenceId', args.referenceId));
		for await (const key of keys) {
			await ctx.db.delete('apikey', key._id);
		}
		return null;
	}
});
