import client from '$lib/db/client';
import { fql } from 'fauna';

import type { CreateOrganizationData } from './types';
import type { Organization } from '$lib/db/schema/types/custom';

export async function createOrganization(
	accessToken: string,
	organizationData: CreateOrganizationData
): Promise<Organization> {
	const response = await client(accessToken).query<Organization>(
		fql`createOrganization(${organizationData})`
	);
	return response.data;
}
