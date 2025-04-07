import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Creates a new organization with the given name, slug, and optional logo
 */
export const createOrganization = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    logoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Create the organization
    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      logoId: args.logoId,
      plan: "Free", // Default plan
    });

    // Add the creator as an owner
    await ctx.db.insert("organizationMembers", {
      organizationId,
      userId,
      role: "role_organization_owner",
    });

    return organizationId;
  },
});

/**
 * Get all organizations for the current user
 */
export const getUserOrganizations = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    // Get all organization memberships for the user
    const memberships = await ctx.db
      .query("organizationMembers")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Get the actual organizations
    const organizations = await Promise.all(
      memberships.map(async (membership) => {
        const org = await ctx.db.get(membership.organizationId);
        if (!org) return null;

        // Add the logo URL if applicable
        if (org.logoId) {
          org.logo = (await ctx.storage.getUrl(org.logoId)) ?? undefined;
        }

        return {
          ...org,
          role: membership.role,
        };
      })
    );

    // Filter out any null values (from orgs that might have been deleted)
    return organizations.filter(Boolean);
  },
});
