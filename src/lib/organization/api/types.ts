import { type } from "arktype";

export const createOrganizationData = type({
    name: 'string',
    "avatar?": 'URL',
    slug: 'string'
})
export type CreateOrganizationData = typeof createOrganizationData.infer
