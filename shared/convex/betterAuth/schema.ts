/**
 * The Better Auth component schema: the generated tables from generatedSchema.ts
 * plus indexes of our own, which survive regenerating it. See
 * https://labs.convex.dev/better-auth/features/local-install#adding-custom-indexes.
 */
import { defineSchema } from 'convex/server';
import { tables } from './generatedSchema';

const schema = defineSchema({
	...tables,
	// Name and email search for the admin users table (admin/convex)
	user: tables.user
		.searchIndex('search_name', { searchField: 'name' })
		.searchIndex('search_email', { searchField: 'email' })
});

export default schema;
