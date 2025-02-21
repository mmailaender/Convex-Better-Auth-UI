import { error, type Actions } from '@sveltejs/kit';
import { type } from 'arktype';

// Lib
import {
	createOrganization,
	deleteOrganization,
	leaveOrganization,
	removeUserFromOrganization,
	transferOwnership,
	updateOrganizationProfile,
	updateUserRole
} from '$lib/organization/api/server';

// Types
import {
	createOrganizationData,
	updateOrganizationProfileData,
	updateUserRoleData
} from '$lib/organization/api/types';

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
	},

	updateOrganizationProfile: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const organizationId = type('string')(formData.get('organizationId'));

		const out = updateOrganizationProfileData({
			name: formData.get('name') || undefined,
			avatar: formData.get('avatar') || undefined,
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

	updateUserRole: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const out = updateUserRoleData({
			userId: formData.get('userId'),
			newRole: formData.get('newRole')
		});

		if (out instanceof type.errors) {
			console.error(out.summary);
			return error(400, { message: out.summary });
		} else {
			try {
				const res = await updateUserRole(accessToken!, out);
				return JSON.stringify(res);
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

		const successorId = type('string.numeric > 0 | null')(formData.get('successorId'));

		if (successorId instanceof type.errors) {
			console.error('Invalid successor ID');
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
				const res = await removeUserFromOrganization(accessToken!, userId);
				return JSON.stringify(res);
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
