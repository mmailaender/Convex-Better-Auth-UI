import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import {
  defineEnt,
  defineEntSchema,
  defineEntsFromTables,
  EntDefinition,
  getEntDefinitions,
} from "convex-ents";
import { TableDefinition } from "convex/server";

const schema = defineEntSchema({
  ...defineEntsFromTables(authTables),

  users: defineEnt({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  }).edges("messages", { ref: true }),

  messages: defineEnt({
    text: v.string(),
  }).edge("user"),

  //...etc
});

export default schema;

export const entDefinitions = getEntDefinitions(schema);
