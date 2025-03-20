import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table
  users: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    primaryEmail: v.string(),
    emails: v.array(v.string()),
    avatar: v.optional(v.string()),
    activeOrganizationId: v.optional(v.id("organizations")),
    // We'll store roles directly instead of computing them
    roles: v.array(v.string()),
  })
    .index("by_primaryEmail", ["primaryEmail"])
    .index("by_emails", ["emails"]),

  // Accounts table - for social and passkey auth
  accounts: defineTable({
    userId: v.id("users"),
    // Social provider data
    socialProviderName: v.optional(v.string()),
    socialProviderUserId: v.optional(v.string()),
    socialProviderEmail: v.optional(v.string()),
    // Passkey data
    passkeyId: v.optional(v.string()),
    passkeyPublicKey: v.optional(v.string()),
    passkeyAlgorithmId: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_social_provider", ["userId", "socialProviderName"])
    .index("by_passkey_id", ["passkeyId"]),

  // Email verifications
  verifications: defineTable({
    email: v.string(),
    otp: v.string(),
    userId: v.optional(v.id("users")),
    expiresAt: v.number(), // TTL implementation
  })
    .index("by_email", ["email"])
    .index("by_user", ["userId"]),

  // Organizations
  organizations: defineTable({
    name: v.string(),
    logo: v.optional(v.string()),
    slug: v.string(),
    plan: v.string(), // "Free", "Pro", "Enterprise"
  })
    .index("by_slug", ["slug"]),

  // Organization memberships
  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.string(), // "role_organization_member", "role_organization_admin", "role_organization_owner"
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_org_and_user", ["organizationId", "userId"]),

  // Invitations
  invitations: defineTable({
    invitedByUserId: v.id("users"),
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.string(), // "role_organization_member", "role_organization_admin", "role_organization_owner"
    expiresAt: v.number(), // TTL implementation - 7 days
  })
    .index("by_organization", ["organizationId"])
    .index("by_email", ["email"])
    .index("by_org_and_email", ["organizationId", "email"]),

  // Sessions
  sessions: defineTable({
    userId: v.id("users"),
    expiresAt: v.number(),
    twoFactorVerified: v.boolean(),
  })
    .index("by_user", ["userId"]),

  // Access tokens - replaces Fauna's built-in token system
  accessTokens: defineTable({
    userId: v.id("users"),
    refreshTokenId: v.id("refreshTokens"),
    tokenHash: v.string(),
    expiresAt: v.number(), // 10 minutes
  })
    .index("by_user", ["userId"])
    .index("by_token_hash", ["tokenHash"]),

  // Refresh tokens
  refreshTokens: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(),
    expiresAt: v.number(), // 8 hours
  })
    .index("by_user", ["userId"])
    .index("by_token_hash", ["tokenHash"]),

  // Roles for RBAC
  roles: defineTable({
    name: v.string(),
  })
    .index("by_name", ["name"]),

  // User-role associations
  userRoles: defineTable({
    userId: v.id("users"),
    roleName: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["roleName"]),
});