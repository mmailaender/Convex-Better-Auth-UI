/**
 * Component-side user functions used exclusively by the application admin
 * dashboard. They read the `user` table directly instead of going through
 * Better Auth's `listUsers` endpoint, which counts and filters by scanning the
 * whole table and can't page with a cursor.
 *
 * Authorization is enforced by the public `admin/*` wrappers via
 * `requireAppAdmin` before any of these functions are reached.
 */
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { query } from './_generated/server';
import { withSystemFields } from 'convex-helpers/validators';
import { paginator } from 'convex-helpers/server/pagination';
import schema from './schema';
import { type Doc } from './_generated/dataModel';

const userValidator = v.object(withSystemFields('user', schema.tables.user.validator.fields));

/**
 * Every user, newest first.
 */
export const listUsers = query({
	args: { paginationOpts: paginationOptsValidator },
	returns: v.object({
		page: v.array(userValidator),
		isDone: v.boolean(),
		continueCursor: v.string(),
		splitCursor: v.optional(v.union(v.string(), v.null())),
		pageStatus: v.optional(
			v.union(v.literal('SplitRecommended'), v.literal('SplitRequired'), v.null())
		)
	}),
	handler: async (ctx, args) => {
		// Components can't use the built-in `.paginate()`, so page with convex-helpers' stream reader
		return await paginator(ctx.db, schema)
			.query('user')
			.order('desc')
			.paginate(args.paginationOpts);
	}
});

/** Search hits to consider before filtering; full-text search returns at most 1024. */
const SEARCH_CANDIDATES = 256;

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
		const words = args.search.toLowerCase().split(/\s+/).filter(Boolean);
		const users = new Map<string, Doc<'user'>>();
		for (const user of [...byName, ...byEmail]) {
			const text = `${user.name} ${user.email}`.toLowerCase();
			if (words.every((word) => text.includes(word))) users.set(user._id, user);
		}
		return [...users.values()].slice(0, args.limit);
	}
});
