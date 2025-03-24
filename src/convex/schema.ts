import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	// Users table
	users: defineTable({
		firstName: v.string(),
		lastName: v.string(),
		primaryEmail: v.string(),
		emails: v.array(v.string()),
		avatarId: v.optional(v.id('_storage')),
		activeOrganizationId: v.optional(v.id('organizations')),
		organizations: v.array(v.id('organizations')),
		// We'll store roles directly instead of computing them
		roles: v.array(v.string())
	})
		.index('by_primaryEmail', ['primaryEmail'])
		.index('by_emails', ['emails']),

	// Accounts table - for social and passkey auth
	accounts: defineTable({
		userId: v.id('users'),
		// Social provider data
		socialProvider: v.optional(
			v.object({
				name: v.string(),
				userId: v.string(),
				email: v.string()
			})
		),
		// Passkey data
		passkey: v.optional(
			v.object({
				id: v.string(),
				publicKey: v.string(),
				algorithmId: v.number()
			})
		)
	})
		.index('by_user', ['userId'])
		.index('by_social_provider', ['socialProvider.userId', 'socialProvider.name'])
		.index('by_passkey_id', ['passkey.id']),

	// Email verifications
	verifications: defineTable({
		email: v.string(),
		otp: v.string(),
		userId: v.optional(v.id('users')),
		expiresAt: v.number() // TTL implementation
	})
		.index('by_email', ['email'])
		.index('by_user', ['userId']),

	// Organizations
	organizations: defineTable({
		name: v.string(),
		logoId: v.optional(v.id('_storage')),
		slug: v.string(),
		plan: v.union(v.literal('Free'), v.literal('Pro'), v.literal('Enterprise'))
		// TODO: members and invitations are computed fields that should be enriched while querying
		// members: v.array(v.id('users')),
		// invitations: v.array(v.id('invitations'))
	}).index('by_slug', ['slug']),

	// Organization memberships
	organizationMembers: defineTable({
		organizationId: v.id('organizations'),
		userId: v.id('users'),
		role: v.string() // "role_organization_member", "role_organization_admin", "role_organization_owner"
	})
		.index('by_organization', ['organizationId'])
		.index('by_user', ['userId'])
		.index('by_org_and_user', ['organizationId', 'userId']),

	// Invitations
	invitations: defineTable({
		invitedByUserId: v.id('users'),
		organizationId: v.id('organizations'),
		email: v.string(),
		role: v.string(), // "role_organization_member", "role_organization_admin", "role_organization_owner"
		expiresAt: v.number() // TTL implementation - 7 days
	})
		.index('by_organization', ['organizationId'])
		.index('by_email', ['email'])
		.index('by_org_and_email', ['organizationId', 'email']),

	// Access tokens - replaces Fauna's built-in token system
	accessTokens: defineTable({
		userId: v.id('users'),
		refreshTokenId: v.id('refreshTokens'),
		tokenHash: v.string(),
		expiresAt: v.number() // 10 minutes
	})
		.index('by_user', ['userId'])
		.index('by_token_hash', ['tokenHash'])
		.index('by_refresh_token', ['refreshTokenId']),

	// Refresh tokens
	refreshTokens: defineTable({
		userId: v.id('users'),
		tokenHash: v.string(),
		expiresAt: v.number() // 8 hours
	})
		.index('by_user', ['userId'])
		.index('by_token_hash', ['tokenHash']),

	// Roles for RBAC
	roles: defineTable({
		name: v.string()
	}).index('by_name', ['name']),

	// User-role associations
	userRoles: defineTable({
		userId: v.id('users'),
		roleName: v.string()
	})
		.index('by_user', ['userId'])
		.index('by_role', ['roleName'])
});
