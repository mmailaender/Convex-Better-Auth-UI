'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { Building2, Users } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import * as Tabs from '@/components/primitives/ui/tabs';
import { AUTH_CONSTANTS } from '@/convex/auth.constants';
import UsersTable from '@/components/admin/ui/UsersTable';
import UserDetails from '@/components/admin/ui/UserDetails';
import OrganizationsTable from '@/components/admin/ui/OrganizationsTable';
import OrganizationDetails from '@/components/admin/ui/OrganizationDetails';
import {
	ORGANIZATION_PARAM,
	TAB_ORGANIZATIONS,
	TAB_USERS,
	USER_PARAM
} from '@/components/admin/utils/admin.constants';

/**
 * Admin dashboard body. Renders a Users tab always and an Organizations tab only
 * when the `organizations` feature toggle is enabled (in addition to `admin`).
 */
export default function AdminDashboard() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const organizationsEnabled = Boolean(AUTH_CONSTANTS.organizations);

	const activeTab = useMemo(() => {
		const param = searchParams.get('adminTab');
		if (param === TAB_ORGANIZATIONS && organizationsEnabled) return TAB_ORGANIZATIONS;
		return TAB_USERS;
	}, [searchParams, organizationsEnabled]);

	// What shows instead of a tab's table, in the URL like the tab: a user profile in either tab,
	// and an organization in the organizations tab, with the profiles of its members above it
	const profileUserId = searchParams.get(USER_PARAM);
	// Ark renders the inactive tab's panel too, hidden, so each tab checks it's the active one
	const usersProfileId = activeTab === TAB_USERS ? profileUserId : null;
	const organizationsProfileId = activeTab === TAB_ORGANIZATIONS ? profileUserId : null;
	const organizationId =
		activeTab === TAB_ORGANIZATIONS ? searchParams.get(ORGANIZATION_PARAM) : null;

	// Names the organization on the back button of a member's profile. The organization page
	// beneath subscribes to the same query, so this doesn't fetch it again
	const organizationDetails = useQuery(
		api.admin.queries.getOrganizationWithMembers,
		organizationId && organizationsProfileId ? { organizationId } : 'skip'
	);

	/** Navigates within the dashboard to the given tab and query parameters. */
	function navigate(
		tab: string,
		params: { [USER_PARAM]?: string | null; [ORGANIZATION_PARAM]?: string | null },
		replace = false
	) {
		const next = new URLSearchParams(searchParams.toString());
		next.set('adminTab', tab);
		for (const [key, value] of Object.entries(params)) {
			if (value) next.set(key, value);
			else next.delete(key);
		}
		const url = `${pathname}?${next.toString()}`;
		// Pages get a history entry, so the browser's back button returns to where the admin came from
		if (replace) router.replace(url, { scroll: false });
		else router.push(url);
	}

	function setActiveTab(tab: string) {
		if (tab === activeTab) return;
		navigate(tab, { [USER_PARAM]: null, [ORGANIZATION_PARAM]: null }, true);
	}

	/** Shows the profile of `userId` above the current tab, or closes the profile. */
	function showProfile(userId: string | null) {
		navigate(activeTab, { [USER_PARAM]: userId });
	}

	/** Shows the page of `id` in the organizations tab, or the organizations table without one. */
	function showOrganization(id: string | null) {
		navigate(TAB_ORGANIZATIONS, { [USER_PARAM]: null, [ORGANIZATION_PARAM]: id });
	}

	function profile(userId: string | null, backLabel: string) {
		return userId ? (
			<UserDetails
				key={userId}
				userId={userId}
				backLabel={backLabel}
				onBack={() => showProfile(null)}
				onViewOrganization={showOrganization}
			/>
		) : null;
	}

	return (
		<Tabs.Root value={activeTab} onValueChange={setActiveTab}>
			<Tabs.List className="flex gap-2">
				<Tabs.Trigger value={TAB_USERS} className="flex items-center gap-2">
					<Users className="size-4" />
					<span>Users</span>
				</Tabs.Trigger>
				{organizationsEnabled ? (
					<Tabs.Trigger value={TAB_ORGANIZATIONS} className="flex items-center gap-2">
						<Building2 className="size-4" />
						<span>Organizations</span>
					</Tabs.Trigger>
				) : null}
			</Tabs.List>

			<Tabs.Content value={TAB_USERS}>
				{profile(usersProfileId, 'Users')}
				{/* Stays mounted behind a profile, so the search and loaded rows survive going back */}
				<div className={usersProfileId ? 'hidden' : undefined}>
					<UsersTable onViewProfile={showProfile} />
				</div>
			</Tabs.Content>

			{organizationsEnabled ? (
				<Tabs.Content value={TAB_ORGANIZATIONS}>
					{profile(
						organizationsProfileId,
						organizationId
							? (organizationDetails?.organization.name ?? 'Organization')
							: 'Organizations'
					)}
					{/* Like the users table, these stay mounted behind what opens above them */}
					{organizationId ? (
						<div className={organizationsProfileId ? 'hidden' : undefined}>
							<OrganizationDetails
								key={organizationId}
								organizationId={organizationId}
								onBack={() => showOrganization(null)}
								onViewProfile={showProfile}
							/>
						</div>
					) : null}
					<div className={organizationsProfileId || organizationId ? 'hidden' : undefined}>
						<OrganizationsTable onViewOrganization={showOrganization} />
					</div>
				</Tabs.Content>
			) : null}
		</Tabs.Root>
	);
}
