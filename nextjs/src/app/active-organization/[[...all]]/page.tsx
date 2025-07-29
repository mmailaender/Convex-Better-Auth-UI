import { redirect } from 'next/navigation';
import { api } from '../../../../convex/_generated/api';
import { getToken } from '@convex-dev/better-auth/nextjs';
import { createAuth } from '@/components/auth/lib/auth';
import { fetchQuery } from 'convex/nextjs';
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
	try {
		// Await the params and searchParams
		const resolvedParams = await params;
		const resolvedSearchParams = await searchParams;

		// Fetch the active organization using Convex HTTP client for server components
		const activeOrganization = await fetchQuery(
			api.organizations.queries.getActiveOrganization,
			{},
			{ token: await getToken(createAuth) }
		);

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

		if (activeOrganization) {
			// Replace /active-organization with the organization slug
			const newPath = originalPath.replace(
				/^\/active-organization(?=\/|$)/,
				`/${activeOrganization.slug}`
			);

			// Include query parameters if they exist
			const fullUrl =
				newPath + (urlSearchParams.toString() ? `?${urlSearchParams.toString()}` : '');

			// Redirect to the organization-specific URL
			redirect(fullUrl);
		}

		// If no active organization, redirect to create one
		redirect(withRedirect('/organization/create', originalPath, urlSearchParams));
	} catch (error) {
		// Re-throw Next.js redirect errors (they're not actual errors)
		if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
			throw error;
		}

		console.error('Error in active org redirect:', error);

		// On actual error, redirect to org creation as fallback
		const resolvedParams = await params;
		const resolvedSearchParams = await searchParams;
		const pathSegments = resolvedParams.all || [];
		const originalPath = `/active-organization/${pathSegments.join('/')}`;
		const urlSearchParams = new URLSearchParams();
		Object.entries(resolvedSearchParams).forEach(([key, value]) => {
			if (Array.isArray(value)) {
				value.forEach((v) => urlSearchParams.append(key, v));
			} else if (value !== undefined) {
				urlSearchParams.set(key, value);
			}
		});

		redirect(withRedirect('/organization/create', originalPath, urlSearchParams));
	}
}
