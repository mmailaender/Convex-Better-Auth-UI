import { error, type Actions } from '@sveltejs/kit';
import { type } from 'arktype';

// Lib
import {
	createOrganization,
	deleteOrganization,
	removeUserFromOrganization,
	leaveOrganization,
	transferOwnership,
	updateOrganizationProfile,
	getUsersOrganizations,
	setActiveOrganization,
	updateMemberRole,
	getOrganizationMembersAndInvitations,
	createInvitation,
	revokeInvitation
} from '$lib/organization/api/server';

// Types
import {
	createOrganizationData,
	updateOrganizationProfileData,
	updateMemberRoleData,
	role
} from '$lib/organization/api/types';
import { verifyEmail } from '$lib/email/api/server';
import { getOrganizationInvitationEmail, sendEmail } from '$lib/email/templates';
import { PUBLIC_APP_NAME } from '$env/static/public';
import { EMAIL_SEND_FROM } from '$env/static/private';
import { parseFormValue } from '$lib/primitives/api/callForm';

export const actions = {
	createOrganization: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const out = createOrganizationData({
			name: formData.get('name'),
			logo: formData.get('logo'),
			slug: formData.get('slug')
		});

		if (out instanceof type.errors) {
			console.error(out.summary);
			return error(400, { message: out.summary });
		} else {
			try {
				const org = await createOrganization(accessToken!, out);
				return JSON.stringify(org);
			} catch (err) {
				console.error('Error creating organization:', err);
				return error(400, { message: 'Failed to create organization' });
			}
		}
	},

	setActiveOrganization: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const organizationId = type('string.numeric > 0')(formData.get('organizationId'));

		if (organizationId instanceof type.errors) {
			console.error('Invalid organization ID');
			return error(400, { message: 'Invalid organization ID' });
		} else {
			try {
				const org = await setActiveOrganization(accessToken!, organizationId);
				return JSON.stringify(org);
			} catch (err) {
				console.error('Error setting active organization:', err);
				return error(400, { message: 'Failed to set active organization' });
			}
		}
	},

	getUsersOrganizations: async ({ cookies }) => {
		const accessToken = cookies.get('access_token');
		try {
			const res = await getUsersOrganizations(accessToken!);
			return JSON.stringify(res);
		} catch (err) {
			console.error('Error getting user organizations:', err);
			return error(400, { message: 'Failed to get user organizations' });
		}
	},

	getOrganizationMembersAndInvitations: async ({ cookies }) => {
		const accessToken = cookies.get('access_token');
		try {
			const membersAndInvitations = await getOrganizationMembersAndInvitations(accessToken!);
			return JSON.stringify(membersAndInvitations);
		} catch (err) {
			console.error('Error getting organization members and invitations:', err);
			return error(400, { message: 'Failed to get organization members and invitations.' });
		}
	},

	inviteUserToOrganization: async ({ cookies, request, url }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const data = type({
			email: 'string.email',
			role: role,
			invitedBy: 'string'
		})({
			email: formData.get('email'),
			role: formData.get('role'),
			invitedBy: formData.get('invitedBy')
		});

		if (data instanceof type.errors) {
			console.error(data.summary);
			return error(400, { message: data.summary });
		} else {
			try {
				const verificationResult = await verifyEmail(data.email);

				if (!verificationResult.valid) {
					console.error(`Email ${data.email} is not valid: ${verificationResult.reason}`);
					return error(400, {
						message: `Email ${data.email} is not valid: ${verificationResult.reason}`
					});
				}
				const invitation = await createInvitation(accessToken!, data.email, data.role);

				const acceptUrl = `${url.origin}/api/org/invitation/accept?invitationId=${invitation.id}`;

				const { html } = await getOrganizationInvitationEmail(
					PUBLIC_APP_NAME,
					data.invitedBy,
					acceptUrl
				);

				const { error: err } = await sendEmail({
					from: EMAIL_SEND_FROM,
					to: data.email,
					subject: `Invitation to join ${PUBLIC_APP_NAME}`,
					html: html
				});

				if (err) {
					throw new Error(err.message);
				}

				console.log(
					`invite-user: Successfully invited ${data.email}, invitation id: ${invitation.id}`
				);

				return JSON.stringify(invitation);
			} catch (err) {
				console.error('Error inviting user:', err);
				return error(400, { message: 'Failed to invite user' });
			}
		}
	},

	revokeInvitation: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const invitationId = type('string.numeric > 0')(formData.get('invitationId'));

		if (invitationId instanceof type.errors) {
			console.error('Invalid invitation ID: ', invitationId.summary);
			return error(400, { message: 'Invalid invitation ID' });
		} else {
			try {
				const res = await revokeInvitation(accessToken!, invitationId);
				return JSON.stringify(res);
			} catch (err) {
				console.error('Error revoking invitation:', err);
				return error(400, { message: 'Failed to revoke invitation' });
			}
		}
	},

	updateOrganizationProfile: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const organizationId = type('string')(formData.get('organizationId'));

		const out = updateOrganizationProfileData({
			name: formData.get('name') || undefined,
			logo: formData.get('logo') || undefined,
			slug: formData.get('slug') || undefined
		});

		if (out instanceof type.errors || organizationId instanceof type.errors) {
			if (out instanceof type.errors) {
				console.error(out.summary);
				return error(400, { message: out.summary });
			} else {
				console.error('Invalid organization ID');
				return error(400, { message: 'Invalid organization ID' });
			}
		} else {
			try {
				const res = await updateOrganizationProfile(accessToken!, organizationId, out);
				return JSON.stringify(res);
			} catch (err) {
				console.error('Error updating organization profile:', err);
				return error(400, { message: 'Failed to update organization profile' });
			}
		}
	},

	updateMemberRole: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const out = updateMemberRoleData({
			userId: formData.get('userId'),
			newRole: formData.get('newRole')
		});

		if (out instanceof type.errors) {
			console.error(out.summary);
			return error(400, { message: out.summary });
		} else {
			try {
				const org = await updateMemberRole(accessToken!, out);
				return JSON.stringify(org);
			} catch (err) {
				console.error('Error updating user role:', err);
				return error(400, { message: 'Failed to update user role' });
			}
		}
	},

	transferOwnership: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const successorId = type('string.numeric > 0')(formData.get('successorId'));

		if (successorId instanceof type.errors) {
			console.error(successorId.summary);
			return error(400, { message: successorId.summary });
		} else {
			try {
				const res = await transferOwnership(accessToken!, successorId);
				return JSON.stringify(res);
			} catch (err) {
				console.error('Error transferring ownership:', err);
				return error(400, { message: 'Failed to transfer ownership' });
			}
		}
	},

	leaveOrganization: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		console.log('successorId: ', parseFormValue(formData.get('successorId')));

		const successorId = type('string.numeric > 0 | null')(
			parseFormValue(formData.get('successorId'))
		);

		if (successorId instanceof type.errors) {
			console.error('Invalid successor ID: ', successorId.summary);
			return error(400, { message: 'Invalid successor ID' });
		} else {
			try {
				const res = await leaveOrganization(accessToken!, successorId || undefined);
				return JSON.stringify(res);
			} catch (err) {
				console.error('Error leaving organization:', err);
				return error(500, { message: 'Failed to leave organization' });
			}
		}
	},

	removeUserFromOrganization: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const userId = type('string.numeric > 0')(formData.get('userId'));

		if (userId instanceof type.errors) {
			console.error('Invalid user ID');
			return error(400, { message: 'Invalid user ID' });
		} else {
			try {
				const members = await removeUserFromOrganization(accessToken!, userId);
				return JSON.stringify(members);
			} catch (err) {
				console.error('Error removing user from organization:', err);
				return error(500, { message: 'Failed to remove user from organization' });
			}
		}
	},

	deleteOrganization: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const organizationId = type('string.numeric > 0')(formData.get('organizationId'));

		if (organizationId instanceof type.errors) {
			console.error('Invalid organization ID');
			return error(400, { message: 'Invalid organization ID' });
		} else {
			try {
				const res = await deleteOrganization(accessToken!, organizationId);
				return JSON.stringify(res);
			} catch (err) {
				console.error('Error deleting organization:', err);
				return error(500, { message: 'Failed to delete organization' });
			}
		}
	}
} satisfies Actions;
