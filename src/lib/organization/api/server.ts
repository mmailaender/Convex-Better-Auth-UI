import client from '$lib/db/client';
import { fql } from 'fauna';

import type {
	CreateOrganizationData,
	UpdateOrganizationData,
	UpdateMemberRoleData,
	UsersOrganizations,
	Member
} from './types';
import type { Organization, User } from '$lib/db/schema/types/custom';
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

export async function getOrganizationMembers(accessToken: string): Promise<Member> {
	const response = await client(accessToken).query<Array<Member>>(
		fql`getOrganizationMembers(Query.identity()!.activeOrganization!.id)
		`
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
		fql`let user = Query.identity()
		let org = user.activeOrganization
		let targetUser = User.byId(ID(${data.userId}))

		org!.update({
			members: (
			  let currentMembers = org!.members.filter(m => m.user != targetUser)
			  currentMembers.append({
				user: targetUser,
				role: ${data.newRole}
			  })
			)
		  })`
	);
	return response.data;
}

export async function leaveOrganization(accessToken: string, successorId?: string): Promise<User> {
	const response = await client(accessToken).query<User>(
		fql`let user = Query.identity()
		removeUserFromOrganization({
			userId: user!.id,
			organizationId: user!.activeOrganization!.id,
			successorId: ${successorId}
		})`
	);
	return response.data;
}

export async function removeUserFromOrganization(
	accessToken: string,
	userId: string
): Promise<Organization> {
	const response = await client(accessToken).query<Organization>(
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
