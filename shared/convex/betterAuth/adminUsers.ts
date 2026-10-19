/**
 * Component-side user functions used exclusively by the application admin
 * dashboard. They read the `user` table directly instead of going through
 * Better Auth's `listUsers` endpoint, which counts and filters by scanning the
 * whole table.
 *
 * Authorization is enforced by the public `admin/*` wrappers via
 * `requireAppAdmin` before any of these functions are reached.
 */
import { v } from 'convex/values';
import { query } from './_generated/server';
import { withSystemFields } from 'convex-helpers/validators';
import schema from './schema';
import { type Doc } from './_generated/dataModel';

const userValidator = v.object(withSystemFields('user', schema.tables.user.validator.fields));

/**
 * The newest `limit` users. Pages grow by raising `limit` rather than with
 * cursors: components can't use the built-in `.paginate()`, and convex-helpers'
 * paginator needs page boundaries the clients don't keep, so a user created or
 * deleted after "Load more" would show twice or not at all.
 */
export const listUsers = query({
	args: { limit: v.number() },
	returns: v.object({ users: v.array(userValidator), hasMore: v.boolean() }),
	handler: async (ctx, args) => {
		const users = await ctx.db
			.query('user')
			.order('desc')
			.take(args.limit + 1);
		return { users: users.slice(0, args.limit), hasMore: users.length > args.limit };
	}
});

/** Search hits to consider before filtering; full-text search returns at most 1024. */
export const SEARCH_CANDIDATES = 256;

/**
 * Whether `text` contains every whitespace-separated word of `search`, ignoring case.
 * Full-text search ranks documents matching any word, so its hits are narrowed with this.
 */
export const containsEveryWord = (text: string, search: string): boolean => {
	const lowerText = text.toLowerCase();
	return search
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean)
		.every((word) => lowerText.includes(word));
};

/**
 * Users whose name or email contains every word of `search`, best matches
 * first, name matches before email matches: "grace@exa" finds
 * "grace@example.com" but not "test@load.example".
 *
 * Full-text search finds the candidates, so each word has to start a word in
 * the name or email ("lov" finds "Ada Lovelace", "elace" doesn't). It ranks any
 * word matching, so the candidates are then narrowed to those containing them all.
 */
export const searchUsers = query({
	args: { search: v.string(), limit: v.number() },
	returns: v.array(userValidator),
	handler: async (ctx, args) => {
		const [byName, byEmail] = await Promise.all([
			ctx.db
				.query('user')
				.withSearchIndex('search_name', (q) => q.search('name', args.search))
				.take(SEARCH_CANDIDATES),
			ctx.db
				.query('user')
				.withSearchIndex('search_email', (q) => q.search('email', args.search))
				.take(SEARCH_CANDIDATES)
		]);
		const users = new Map<string, Doc<'user'>>();
		for (const user of [...byName, ...byEmail]) {
			if (containsEveryWord(`${user.name} ${user.email}`, args.search)) users.set(user._id, user);
		}
		return [...users.values()].slice(0, args.limit);
	}
});
