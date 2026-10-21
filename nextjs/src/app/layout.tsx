import Link from 'next/link';
import { ConvexClientProvider } from './ConvexClientProvider';

import type { Metadata } from 'next';
import './globals.css';

// Primitives
import { Toaster } from '@/components/primitives/ui/sonner';
// Components
import OrganizationSwitcher from '@/components/organizations/ui/OrganizationSwitcher';
import OrganizationProfileHost from '@/components/organizations/ui/OrganizationProfileHost';
import UserButton from '@/components/users/ui/UserButton';
import UserProfileHost from '@/components/users/ui/UserProfileHost';
import ImpersonationBanner from '@/components/admin/ui/ImpersonationBanner';
import { AUTH_CONSTANTS } from '@/convex/auth.constants';
import { api } from '@/convex/_generated/api';
import { fetchAuthQuery, getToken } from '@/lib/auth/api/server';
import type { InitialAuthData } from '@/lib/auth/types';

export const metadata: Metadata = {
	title: 'Convex Better Auth UI',
	description: 'Auth, user, and organization management widgets for Convex and Better Auth'
};

export default async function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	const initialToken = await getToken();
	let initialData: InitialAuthData | undefined;

	if (initialToken) {
		try {
			const organizationsEnabled = AUTH_CONSTANTS.organizations;
			const [activeUser, accountList, activeOrganization, organizationList, invitationList, role] =
				await Promise.all([
					fetchAuthQuery(api.users.queries.getActiveUser),
					fetchAuthQuery(api.users.queries.listAccounts),
					organizationsEnabled
						? fetchAuthQuery(api.organizations.queries.getActiveOrganization)
						: Promise.resolve(undefined),
					organizationsEnabled
						? fetchAuthQuery(api.organizations.queries.listOrganizations)
						: Promise.resolve(undefined),
					organizationsEnabled
						? fetchAuthQuery(api.organizations.invitations.queries.listInvitations)
						: Promise.resolve(undefined),
					organizationsEnabled
						? fetchAuthQuery(api.organizations.queries.getOrganizationRole, {})
						: Promise.resolve(undefined)
				]);

			initialData = {
				activeUser,
				accountList,
				activeOrganization,
				organizationList,
				invitationList,
				role: role ?? undefined
			};
		} catch (error) {
			console.error('Failed to preload auth data for layout', error);
		}
	}

	return (
		<html lang="en" data-theme="auth">
			<body>
				<ConvexClientProvider initialToken={initialToken ?? null} initialData={initialData}>
					<div className="flex min-h-[100dvh] flex-col">
						{AUTH_CONSTANTS.admin ? <ImpersonationBanner /> : null}
						<header className="flex min-w-0 items-center justify-between gap-2 p-3 sm:gap-5 sm:p-4">
							<Link
								href="/"
								className="text-surface-950-50 mr-auto min-w-0 truncate text-xl font-bold sm:text-2xl"
							>
								Next.js
							</Link>
							{AUTH_CONSTANTS.organizations ? <OrganizationSwitcher /> : null}
							<UserButton />
						</header>
						<main>{children}</main>
					</div>
					{AUTH_CONSTANTS.organizations ? <OrganizationProfileHost /> : null}
					<UserProfileHost />
				</ConvexClientProvider>
				<Toaster position="top-center" />
			</body>
		</html>
	);
}
