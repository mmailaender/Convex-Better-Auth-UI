import client from '$lib/db/client';
import { fql } from 'fauna';

import type {
	CreateOrganizationData,
	UpdateOrganizationData,
	UpdateMemberRoleData,
	UsersOrganizations,
	Member,
	Role
} from './types';
import type { Invitation, Organization, User } from '$lib/db/schema/types/custom';
import type { NullDocument } from '$lib/db/schema/types/system';

export async function createOrganization(
	accessToken: string,
	organizationData: CreateOrganizationData
): Promise<Organization> {
	const response = await client(accessToken).query<Organization>(
		fql`createOrganization( ${organizationData} )`
	);
	return response.data;
}

export async function setActiveOrganization(
	accessToken: string,
	organizationId: string
): Promise<Organization> {
	const response = await client(accessToken).query<Organization>(
		fql`Query.identity()!.update({ activeOrganization: Organization.byId( ${organizationId} ) })
		Organization.byId( ${organizationId} )`
	);
	return response.data;
}

export async function getUsersOrganizations(accessToken: string): Promise<UsersOrganizations> {
	const response = await client(accessToken).query<UsersOrganizations>(
		fql`Query.identity() {
			id,
			activeOrganization,
			organizations
		  }`
	);
	return response.data;
}

export async function getOrganizationMembers(accessToken: string): Promise<Array<Member>> {
	const response = await client(accessToken).query<Array<Member>>(
		fql`getOrganizationMembers(Query.identity()!.activeOrganization!.id)
		`
	);
	return response.data;
}

export async function createInvitation(
	accessToken: string,
	email: string,
	role: Role
): Promise<Invitation> {
	const response = await client(accessToken).query<Invitation>(
		fql`createInvitation(Query.identity()!.activeOrganization!.id, ${email}, ${role})`
	);
	return response.data;
}

export async function acceptInvitation(accessToken: string, invitationId: string): Promise<User> {
	const response = await client(accessToken).query<User>(
		fql`let userId = Query.identity()!.id
		acceptInvitation( { userId: userId, invitationId: ID(${invitationId}) } )`
	);
	return response.data;
}

export async function updateOrganizationProfile(
	accessToken: string,
	organizationId: string,
	organizationData: UpdateOrganizationData
): Promise<Organization> {
	const response = await client(accessToken).query<Organization>(
		fql`Organization.byId( ${organizationId} )!.update( ${organizationData} )`
	);
	return response.data;
}

export async function updateMemberRole(
	accessToken: string,
	data: UpdateMemberRoleData
): Promise<Organization> {
	const response = await client(accessToken).query<Organization>(
		fql`let user: Any = Query.identity()
		let user: User = user
		let org = user.activeOrganization
		let targetUser = User.byId(${data.userId})
		
		let currentMembers = org!.members.filter(m => m.user != targetUser)
		let currentMembers = currentMembers.append({
			user: targetUser,
			role: ${data.newRole}
		})
		
		org!.update({
			members: currentMembers
		})`
	);
	return response.data;
}

/**
 * Allows a user to leave an organization.
 * If the user is an admin/owner, a successor ID can be provided to transfer ownership.
 *
 * @param {string} accessToken - The user's access token
 * @param {string} [successorId] - Optional ID of the user who will become the new admin/owner
 * @returns {Promise<User>} The updated user object after leaving the organization
 */
export async function leaveOrganization(accessToken: string, successorId?: string): Promise<User> {
	const params = {
		userId: fql`Query.identity()!.id`,
		organizationId: fql`Query.identity()!.activeOrganization!.id`
	};

	// Add successorId if provided
	const finalParams = successorId ? { ...params, successorId } : params;

	const response = await client(accessToken).query<User>(
		fql`removeUserFromOrganization(${finalParams})`
	);

	return response.data;
}

export async function removeUserFromOrganization(
	accessToken: string,
	userId: string
): Promise<Array<Member>> {
	const response = await client(accessToken).query<Array<Member>>(
		fql`let user = Query.identity()
		removeUserFromOrganization({
			userId: ${userId},
			organizationId: user!.activeOrganization!.id
		})`
	);
	return response.data;
}

export async function deleteOrganization(
	accessToken: string,
	organizationId: string
): Promise<NullDocument> {
	const response = await client(accessToken).query<NullDocument>(
		fql`deleteOrganization( ${organizationId} )`
	);
	return response.data;
}

export async function transferOwnership(
	accessToken: string,
	successorId: string
): Promise<Organization> {
	const response = await client(accessToken).query<Organization>(
		fql`transferOwnership({
			organizationId: Query.identity()!.activeOrganization!.id,
			ownerId: Query.identity()!.id,
			successorId: ${successorId}
		})`
	);
	return response.data;
}
