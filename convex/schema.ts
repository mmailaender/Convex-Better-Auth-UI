import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const roleValidator = v.union(
  v.literal("role_organization_member"),
  v.literal("role_organization_admin"),
  v.literal("role_organization_owner")
);

const schema = defineSchema({
  ...authTables,

  users: defineTable({
    name: v.string(),
    email: v.string(),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    image: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    activeOrganizationId: v.optional(v.id("organizations")),
  })
    .index("email", ["email"])
    .index("imageId", ["imageId"]),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    logo: v.optional(v.string()),
    logoId: v.optional(v.id("_storage")),
    plan: v.union(v.literal("Free"), v.literal("Pro"), v.literal("Enterprise")),
  }).index("slug", ["slug"]),

  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: roleValidator,
  })
    .index("orgId_and_userId", ["organizationId", "userId"])
    .index("orgId", ["organizationId"])
    .index("userId", ["userId"]),

  invitations: defineTable({
    organizationId: v.id("organizations"),
    invitedByUserId: v.id("users"),
    email: v.string(),
    role: roleValidator,
    expiresAt: v.number(), // TTL implementation - 7 days
  })
    .index("by_org_and_email", ["organizationId", "email"])
    .index("email", ["email"])
    .index("expiration", ["expiresAt"]),
});

export default schema;
