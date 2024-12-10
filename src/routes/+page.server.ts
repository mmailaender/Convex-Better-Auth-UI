import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
    const user = locals.user ? JSON.stringify(locals.user) : null;
    console.log("user: ", user);
    return { user };
}) satisfies PageServerLoad;