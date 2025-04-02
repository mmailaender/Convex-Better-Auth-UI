// src/routes/api/org/invitation/accept/+server.ts
import { redirect, error, type RequestEvent } from '@sveltejs/kit';
import { acceptInvitation } from '$lib/organization/api/server';

/**
 * Handles the acceptance of organization invitations.
 * This route requires authentication - unauthenticated users will be redirected to sign-in.
 */
export async function GET(event: RequestEvent) {
	const invitationId = event.url.searchParams.get('invitationId');

	if (!invitationId) {
		throw error(400, 'Invalid invitation: missing token');
	}

	// Get the access token from cookies
	const accessToken = event.cookies.get('access_token');

	try {
		// Call the Fauna function to accept the invitation
		await acceptInvitation(accessToken!, invitationId);
	} catch (err) {
		console.error('Error accepting invitation:', err);

		if (err.abort) {
			throw error(400, err.abort);
		}

		// Return a 400 error with the error message
		throw error(
			400,
			err instanceof Error ? err.message : 'An error occurred while accepting the invitation'
		);
	}
	// Redirect to home page after successful acceptance
	throw redirect(302, '/');
}
