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

    // Set the new organization as active
    await ctx.db.patch(userId, {
      activeOrganizationId: organizationId,
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
      .withIndex("userId", (q) => q.eq("userId", userId))
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

    return organizations;
  },
});

/**
 * Gets the active organization for the current user
 */
export const getActiveOrganization = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get the user to see if they have an active organization
    const user = await ctx.db.get(userId);
    if (!user || !user.activeOrganizationId) {
      // No active organization set, try to get the first organization
      const memberships = await ctx.db
        .query("organizationMembers")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();

      if (memberships.length === 0) {
        return null;
      }

      // Use the first organization as active by default
      const org = await ctx.db.get(memberships[0].organizationId);
      if (!org) return null;

      // Add the logo URL if applicable
      if (org.logoId) {
        org.logo = (await ctx.storage.getUrl(org.logoId)) ?? undefined;
      }

      return {
        ...org,
        role: memberships[0].role,
      };
    }

    // Get the active organization
    const org = await ctx.db.get(user.activeOrganizationId);
    if (!org) return null;

    // Find the user's role in this organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("orgId_and_userId", (q) =>
        q.eq("organizationId", org._id).eq("userId", userId)
      )
      .first();
    if (!membership) {
      return null;
    }

    // Add the logo URL if applicable
    if (org.logoId) {
      org.logo = (await ctx.storage.getUrl(org.logoId)) ?? undefined;
    }

    return {
      ...org,
      role: membership.role,
    };
  },
});

/**
 * Sets the active organization for the current user
 */
export const setActiveOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the user is a member of the organization
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("orgId_and_userId", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this organization");
    }

    // Update the user's active organization
    return await ctx.db.patch(userId, {
      activeOrganizationId: args.organizationId,
    });
  },
});

/**
 * Leave an organization (remove yourself as a member)
 */
export const leaveOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the membership
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("orgId_and_userId", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("Not a member of this organization");
    }

    // Check if user is the owner and the only owner
    if (membership.role === "role_organization_owner") {
      const otherOwners = await ctx.db
        .query("organizationMembers")
        .filter((q) =>
          q.and(
            q.eq(q.field("organizationId"), args.organizationId),
            q.eq(q.field("role"), "role_organization_owner"),
            q.neq(q.field("userId"), userId)
          )
        )
        .collect();

      if (otherOwners.length === 0) {
        throw new Error(
          "Cannot leave organization as the only owner. Transfer ownership first or delete the organization."
        );
      }
    }

    // Remove the membership
    await ctx.db.delete(membership._id);

    // If this was the user's active organization, unset it
    const user = await ctx.db.get(userId);
    if (user && user.activeOrganizationId === args.organizationId) {
      // Find another organization to set as active
      const otherMemberships = await ctx.db
        .query("organizationMembers")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();

      if (otherMemberships.length > 0) {
        await ctx.db.patch(userId, {
          activeOrganizationId: otherMemberships[0].organizationId,
        });
      } else {
        await ctx.db.patch(userId, {
          activeOrganizationId: undefined,
        });
      }
    }

    return true;
  },
});

/**
 * Updates an organization's profile information
 */
export const updateOrganizationProfile = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    slug: v.string(),
    logoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify the user is a member of the organization with admin/owner role
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("orgId_and_userId", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this organization");
    }

    if (
      !["role_organization_owner", "role_organization_admin"].includes(
        membership.role
      )
    ) {
      throw new Error(
        "User does not have permission to update this organization"
      );
    }

    if (args.logoId !== undefined) {
      // Logo is being updated
      // Get the existing organization to check if we need to delete an old logo
      const organization = await ctx.db.get(args.organizationId);
      if (!organization) {
        throw new Error("Organization not found");
      }

      // If the logo is being updated and there was an old one, delete it
      if (
        organization.logoId && // There's an existing logo
        args.logoId !== organization.logoId // The logo is actually changing
      ) {
        // Delete the old logo file
        await ctx.storage.delete(organization.logoId);
      }
    }

    // Update the organization
    return await ctx.db.patch(args.organizationId, {
      name: args.name,
      slug: args.slug,
      ...(args.logoId && { logoId: args.logoId }),
    });
  },
});
