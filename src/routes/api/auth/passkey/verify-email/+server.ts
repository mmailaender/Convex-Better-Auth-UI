import { error, json } from '@sveltejs/kit';
import { verifyEmail } from '$lib/email/api/server';
import type { RequestEvent, RequestHandler } from './$types';

export const GET: RequestHandler = async (event: RequestEvent) => {
    const url = new URL(event.request.url);
    const email = url.searchParams.get('email');
    const userId = url.searchParams.get('userId');
    console.log('GET request received', { email, userId });

    if (typeof email !== 'string' || (userId !== null && typeof userId !== 'string')) {
        console.error('Invalid or missing fields');
        return error(400, 'Invalid or missing fields');
    }

    try {
        const userExists = await verifyEmail(email, userId || undefined);
        return json({ userExists });
    } catch (err) {
        console.error(`verify-email: Error verifying email ${email}`, err);
        return error(500, 'Internal Server Error');
    }
};