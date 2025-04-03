import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import {
  defineEnt,
  defineEntSchema,
  defineEntsFromTables,
  getEntDefinitions,
} from "convex-ents";

const schema = defineEntSchema({
  ...defineEntsFromTables(authTables),

  users: defineEnt({
    name: v.string(),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })
    .field("email", v.string(), { index: true })
    .edges("messages", { ref: true }),

  messages: defineEnt({
    text: v.string(),
  }).edge("user"),

  //...etc
});

export default schema;

export const entDefinitions = getEntDefinitions(schema);
