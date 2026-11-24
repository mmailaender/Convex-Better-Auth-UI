import { redirect } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { fetchAuthQuery } from '@/lib/auth/api/server';
interface ActiveOrgPageProps {
	params: Promise<{
		all: string[];
	}>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Helper function to build redirect URL with query parameters
 */
function withRedirect(to: string, originalPath: string, searchParams: URLSearchParams) {
	const redirectTo = encodeURIComponent(
		originalPath + (searchParams.toString() ? `?${searchParams.toString()}` : '')
	);
	return `${to}?redirectTo=${redirectTo}`;
}

/**
 * Page component that handles /active-org/* routes
 * Migrated from middleware due to Better Auth not supporting middleware API calls
 */
export default async function ActiveOrgPage({ params, searchParams }: ActiveOrgPageProps) {
	// Await the params and searchParams
	const resolvedParams = await params;
	const resolvedSearchParams = await searchParams;

	// Build the original path from params
	const pathSegments = resolvedParams.all || [];
	const originalPath = `/active-organization/${pathSegments.join('/')}`;

	// Convert searchParams to URLSearchParams for easier handling
	const urlSearchParams = new URLSearchParams();
	Object.entries(resolvedSearchParams).forEach(([key, value]) => {
		if (Array.isArray(value)) {
			value.forEach((v) => urlSearchParams.append(key, v));
		} else if (value !== undefined) {
			urlSearchParams.set(key, value);
		}
	});

	/* `null` is a confirmed absence: no one signed in, or no active organization. A lookup that
	   fails throws, and the error reaches Next.js's error page: sending a user who has an
	   organization to create one would take the failure for "none". */
	const activeOrganization = await fetchAuthQuery(api.organizations.queries.getActiveOrganization);

	if (activeOrganization) {
		// Replace /active-organization with the organization slug
		const newPath = originalPath.replace(
			/^\/active-organization(?=\/|$)/,
			`/${activeOrganization.slug}`
		);

		// Include query parameters if they exist
		const fullUrl = newPath + (urlSearchParams.toString() ? `?${urlSearchParams.toString()}` : '');

		// Redirect to the organization-specific URL
		redirect(fullUrl);
	}

	// If no active organization, redirect to create one
	redirect(withRedirect('/organization/create', originalPath, urlSearchParams));
}
