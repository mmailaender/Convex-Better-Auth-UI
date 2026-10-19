'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building2, Users } from 'lucide-react';

import * as Tabs from '@/components/primitives/ui/tabs';
import { AUTH_CONSTANTS } from '@/convex/auth.constants';
import UsersTable from '@/components/admin/ui/UsersTable';
import UserDetails from '@/components/admin/ui/UserDetails';
import OrganizationsTable from '@/components/admin/ui/OrganizationsTable';
import { TAB_ORGANIZATIONS, TAB_USERS, USER_PARAM } from '@/components/admin/utils/admin.constants';

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

	// The user whose profile shows instead of the users table, in `?adminUser=` like the tab
	const profileUserId = searchParams.get(USER_PARAM);

	function setActiveTab(tab: string) {
		const params = new URLSearchParams(searchParams.toString());
		params.set('adminTab', tab);
		params.delete(USER_PARAM);
		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
	}

	/** Shows the profile of `userId`, or the users table without one. */
	function showProfile(userId: string | null) {
		const params = new URLSearchParams(searchParams.toString());
		params.set('adminTab', TAB_USERS);
		if (userId) params.set(USER_PARAM, userId);
		else params.delete(USER_PARAM);
		// A new history entry, so the browser's back button returns to where the admin came from
		router.push(`${pathname}?${params.toString()}`);
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
				{profileUserId ? (
					<UserDetails
						key={profileUserId}
						userId={profileUserId}
						onBack={() => showProfile(null)}
					/>
				) : null}
				{/* Stays mounted behind a profile, so the search and loaded rows survive going back */}
				<div className={profileUserId ? 'hidden' : undefined}>
					<UsersTable onViewProfile={showProfile} />
				</div>
			</Tabs.Content>

			{organizationsEnabled ? (
				<Tabs.Content value={TAB_ORGANIZATIONS}>
					<OrganizationsTable onViewProfile={showProfile} />
				</Tabs.Content>
			) : null}
		</Tabs.Root>
	);
}
