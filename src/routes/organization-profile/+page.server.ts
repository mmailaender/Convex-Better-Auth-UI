import { error, type Actions } from "@sveltejs/kit";
import { type } from "arktype";

// Lib
import { createOrganization } from "$lib/organization/api/server";

// Types
import { createOrganizationData } from "$lib/organization/api/types";

export const actions = {
    createOrganization: async ({ cookies, request }) => {
        const accessToken = cookies.get('access_token');
        const formData = await request.formData();

        const out = createOrganizationData({
            name: formData.get('name'),
            avatar: formData.get('avatar'),
            slug: formData.get('slug')
        });

        if (out instanceof type.errors) {
            console.error(out.summary);
            return error(400, { message: out.summary });
        } else {
            try {
                const res = await createOrganization(accessToken!, out);
                return JSON.stringify(res);
            } catch (err) {
                console.error('Error creating organization:', err);
                return error(400, { message: 'Failed to create organization' });
            }
        }
    }
} satisfies Actions