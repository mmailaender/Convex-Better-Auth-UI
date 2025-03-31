import { v } from 'convex/values';
import { defineEnt, defineEntSchema, getEntDefinitions } from 'convex-ents';

const schema = defineEntSchema({
	// Users table
	users: defineEnt({
		firstName: v.string(),
		lastName: v.string(),
		primaryEmail: v.string(),
		emails: v.array(v.string()),
		// We'll store roles directly instead of computing them
		roles: v.array(v.string())
	})
		.index('by_primaryEmail', ['primaryEmail'])
		.index('by_emails', ['emails'])
		.edges('accounts', { ref: true })
		.edge('avatar', { to: '_storage', deletion: 'hard' })
		.edges('organizationMembers', { ref: true, deletion: undefined })
		.edge('organization', { field: 'activeOrganizationId', deletion: undefined, optional: true })
		.edge('verification', { ref: true })
		.edges('invitations', { ref: true })
		.edges('accessTokens', { ref: true })
		.edges('refreshTokens', { ref: true })
		.edges('roles', { ref: true, to: 'userRoles' }),
	// Accounts table - for social and passkey auth
	accounts: defineEnt({
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
		.edge('user', { to: 'users' })
		.index('by_social_provider', ['socialProvider.userId', 'socialProvider.name'])
		.index('by_passkey_id', ['passkey.id'])
		.index('by_provider_passkey', ['userId', 'passkey', 'socialProvider.name']),

	// Email verifications
	verifications: defineEnt({
		otp: v.string(),
		expiresAt: v.number() // TTL implementation
	})
		.field('email', v.string(), { unique: true })
		.edge('user', { to: 'users', field: 'userId', optional: true })
		.index('by_expiration', ['expiresAt']),

	// Organizations
	organizations: defineEnt({
		name: v.string(),
		plan: v.union(v.literal('Free'), v.literal('Pro'), v.literal('Enterprise'))
	})
		.field('slug', v.string(), { unique: true })
		.edge('logo', { to: '_storage', deletion: 'hard' })
		.edges('members', { ref: true, to: 'organizationMembers' })
		.edges('invitations', { ref: true })
		.edges('users', { ref: true, deletion: undefined }),

	// Organization memberships
	organizationMembers: defineEnt({
		role: v.union(
			v.literal('role_organization_member'),
			v.literal('role_organization_admin'),
			v.literal('role_organization_owner')
		)
	})
		.edge('organization')
		.edge('user')
		.index('by_org_and_user', ['organizationId', 'userId']),

	// Invitations
	invitations: defineEnt({
		email: v.string(),
		role: v.union(
			v.literal('role_organization_member'),
			v.literal('role_organization_admin'),
			v.literal('role_organization_owner')
		),
		expiresAt: v.number() // TTL implementation - 7 days
	})
		.edge('invitedBy', { to: 'users', field: 'invitedByUserId' })
		.edge('organization', { to: 'organizations' })
		.index('by_org_and_email', ['organizationId', 'email'])
		.index('by_email', ['email'])
		.index('by_expiration', ['expiresAt']),

	// Access tokens - replaces Fauna's built-in token system
	accessTokens: defineEnt({
		tokenHash: v.string(),
		expiresAt: v.number() // 10 minutes
	})
		.edge('user', { to: 'users' })
		.edge('refreshToken', { to: 'refreshTokens' })
		.index('by_token_hash', ['tokenHash'])
		.index('by_expiration', ['expiresAt']),

	// Refresh tokens
	refreshTokens: defineEnt({
		tokenHash: v.string(),
		expiresAt: v.number() // 8 hours
	})
		.edge('user', { to: 'users' })
		.edge('accessToken', { ref: true })
		.index('by_token_hash', ['tokenHash'])
		.index('by_expiration', ['expiresAt']),

	// Roles for RBAC
	roles: defineEnt({
		name: v.string()
	}).index('by_name', ['name']),

	// User-role associations
	userRoles: defineEnt({
		roleName: v.string()
	})
		.edge('user', { to: 'users' })
		.index('by_role', ['roleName'])
});

export default schema;

export const entDefinitions = getEntDefinitions(schema);
