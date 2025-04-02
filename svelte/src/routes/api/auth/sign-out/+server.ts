import type { RequestEvent, RequestHandler } from './$types';
import  { signOut } from '$lib/auth/api/signOut.server';

export const GET: RequestHandler = async (event: RequestEvent) => {
    const success = await signOut(event);
    if (success) {
        return new Response(null, { status: 200 });
    } else {
        return new Response('Sign-out failed', { status: 500 });
    }
};
