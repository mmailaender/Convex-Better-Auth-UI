import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// const schema = defineSchema({ ...authFullTables });
const schema = defineSchema({
	users: defineTable({
		imageId: v.optional(v.id('_storage')),
		activeOrganizationId: v.optional(v.string())
	}),

	organizations: defineTable({
		logoId: v.optional(v.id('_storage')),
		betterAuthId: v.string()
	}).index('betterAuthId', ['betterAuthId'])
});

export default schema;
