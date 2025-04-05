import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

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
  })
    .index("email", ["email"])
    .index("imageId", ["imageId"]),

  messages: defineTable({
    text: v.string(),
    userId: v.id("users"),
  }).index("userId", ["userId"]),
});

export default schema;
