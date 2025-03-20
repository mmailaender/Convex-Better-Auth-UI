import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Convex schema definition that maps Fauna collections to Convex tables
 */
export default defineSchema({
	// Users table - maps to User collection in Fauna
	users: defineTable({
		firstName: v.string(),
		lastName: v.string(),
		primaryEmail: v.string(),
		emails: v.array(v.string()),
		avatar: v.optional(v.string()),
		// In Convex, we'll store activeOrganizationId instead of a reference
		activeOrganizationId: v.optional(v.id('organizations')),
		// We'll handle this in the application logic rather than computed fields
		recovery_code: v.optional(v.string())
	})
		.index('by_email', ['primaryEmail'])
		.index('by_emails', ['emails']), // This creates a multi-value index on emails array

	// Accounts table - maps to Account collection in Fauna
	accounts: defineTable({
		userId: v.id('users'),
		// Social provider details
		socialProvider: v.optional(
			v.object({
				name: v.union(v.literal('Github'), v.literal('Google'), v.literal('Facebook')),
				userId: v.string(),
				email: v.string()
			})
		),
		// Passkey details
		passkey: v.optional(
			v.object({
				publicKey: v.string(),
				algorithmId: v.number(),
				id: v.string()
			})
		)
	})
		.index('by_user_id', ['userId'])
		.index('by_social_provider', ['socialProvider.name', 'socialProvider.userId'])
		.index('by_passkey_id', ['passkey.id']),

	// Tokens table - maps to Token collection in Fauna
	tokens: defineTable({
		// In Convex, we use IDs rather than references directly
		userId: v.id('users'),
		secret: v.string(),
		type: v.union(v.literal('access'), v.literal('refresh')),
		// For access tokens, store the refresh token ID
		refreshTokenId: v.optional(v.id('tokens')),
		// Expiration timestamp
		expiresAt: v.number()
	})
		.index('by_user_id', ['userId'])
		.index('by_secret', ['secret'])
		.index('by_refresh_token_id', ['refreshTokenId']),

	// Verifications table - maps to Verification collection in Fauna
	verifications: defineTable({
		email: v.string(),
		otp: v.string(),
		userId: v.optional(v.id('users')), // Optional because sometimes verifications are created for non-users
		expiresAt: v.number() // Expiration timestamp, replacing ttl_days
	})
		.index('by_email', ['email'])
		.index('by_otp', ['otp']),

	// Organizations table - maps to Organization collection in Fauna
	organizations: defineTable({
		name: v.string(),
		logo: v.optional(v.string()),
		slug: v.string(),
		plan: v.union(v.literal('Free'), v.literal('Pro'), v.literal('Enterprise'))
	}).index('by_slug', ['slug']),

	// OrganizationMembers - normalizing the members field in Fauna's Organization
	organizationMembers: defineTable({
		organizationId: v.id('organizations'),
		userId: v.id('users'),
		role: v.union(
			v.literal('role_organization_member'),
			v.literal('role_organization_admin'),
			v.literal('role_organization_owner')
		)
	})
		.index('by_organization_id', ['organizationId'])
		.index('by_user_id', ['userId'])
		.index('by_org_and_user', ['organizationId', 'userId']),

	// Invitations table - maps to Invitation collection in Fauna
	invitations: defineTable({
		invitedByUserId: v.id('users'),
		organizationId: v.id('organizations'),
		email: v.string(),
		role: v.union(
			v.literal('role_organization_member'),
			v.literal('role_organization_admin'),
			v.literal('role_organization_owner')
		),
		expiresAt: v.number() // Expiration timestamp, replacing ttl_days
	})
		.index('by_organization_id', ['organizationId'])
		.index('by_email', ['email'])
		.index('by_org_and_email', ['organizationId', 'email']),

	// RoleAssignments - replacing Fauna's RoleCheck concept
	roleAssignments: defineTable({
		userId: v.id('users'),
		role: v.string() // e.g., 'role_user', 'role_signIn', etc.
	})
		.index('by_user_id', ['userId'])
		.index('by_role', ['role'])
});
