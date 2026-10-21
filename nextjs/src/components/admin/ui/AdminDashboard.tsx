'use client';

import { useEffect, useMemo, useRef } from 'react';
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
import QueryErrorBoundary from '@/components/admin/ui/QueryErrorBoundary';
import {
	ORGANIZATION_PARAM,
	TAB_ORGANIZATIONS,
	TAB_USERS,
	USER_PARAM
} from '@/components/admin/utils/admin.constants';
import { focusTarget, focusVisible, type AdminView } from '@/components/admin/utils/focus';

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

	// Moves focus to a page that opens and back to its link once it closes, also when the browser's
	// back and forward buttons open or close it. A reload keeps the browser's focus
	const rootRef = useRef<HTMLDivElement>(null);
	const lastView = useRef<AdminView | null>(null);
	useEffect(() => {
		const view: AdminView = { tab: activeTab, user: profileUserId, organization: organizationId };
		const target = lastView.current && focusTarget(lastView.current, view);
		lastView.current = view;
		if (target && rootRef.current) focusVisible(rootRef.current, target);
	}, [activeTab, profileUserId, organizationId]);

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

	/**
	 * Shows the profile of `userId` above the current tab, or closes the profile. Closing replaces
	 * the profile's history entry, so the browser's back button doesn't open it again
	 */
	function showProfile(userId: string | null) {
		navigate(activeTab, { [USER_PARAM]: userId }, !userId);
	}

	/**
	 * Shows the page of `id` in the organizations tab, or the organizations table without one,
	 * replacing the page's history entry like closing a profile
	 */
	function showOrganization(id: string | null) {
		navigate(TAB_ORGANIZATIONS, { [USER_PARAM]: null, [ORGANIZATION_PARAM]: id }, !id);
	}

	function profile(userId: string | null, backLabel: string) {
		return userId ? (
			<QueryErrorBoundary key={userId}>
				<UserDetails
					userId={userId}
					backLabel={backLabel}
					onBack={() => showProfile(null)}
					onViewOrganization={showOrganization}
				/>
			</QueryErrorBoundary>
		) : null;
	}

	return (
		<Tabs.Root ref={rootRef} value={activeTab} onValueChange={setActiveTab}>
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
					<QueryErrorBoundary>
						<UsersTable onViewProfile={showProfile} />
					</QueryErrorBoundary>
				</div>
			</Tabs.Content>

			{organizationsEnabled ? (
				<Tabs.Content value={TAB_ORGANIZATIONS}>
					{organizationId && organizationsProfileId ? (
						<QueryErrorBoundary key={`${organizationId}:${organizationsProfileId}`}>
							<MemberProfile
								organizationId={organizationId}
								userId={organizationsProfileId}
								onBack={() => showProfile(null)}
								onViewOrganization={showOrganization}
							/>
						</QueryErrorBoundary>
					) : (
						profile(organizationsProfileId, 'Organizations')
					)}
					{/* Like the users table, these stay mounted behind what opens above them */}
					{organizationId ? (
						<div className={organizationsProfileId ? 'hidden' : undefined}>
							<QueryErrorBoundary key={organizationId}>
								<OrganizationDetails
									organizationId={organizationId}
									onBack={() => showOrganization(null)}
									onViewProfile={showProfile}
								/>
							</QueryErrorBoundary>
						</div>
					) : null}
					<div className={organizationsProfileId || organizationId ? 'hidden' : undefined}>
						<QueryErrorBoundary>
							<OrganizationsTable onViewOrganization={showOrganization} />
						</QueryErrorBoundary>
					</div>
				</Tabs.Content>
			) : null}
		</Tabs.Root>
	);
}

/**
 * The profile of a member above their organization's page, its back button named after the
 * organization. The page beneath subscribes to the same query, so this doesn't fetch it again
 */
function MemberProfile({
	organizationId,
	userId,
	onBack,
	onViewOrganization
}: {
	organizationId: string;
	userId: string;
	onBack: () => void;
	onViewOrganization: (organizationId: string | null) => void;
}) {
	const organizationDetails = useQuery(api.admin.queries.getOrganizationWithMembers, {
		organizationId
	});
	return (
		<UserDetails
			userId={userId}
			backLabel={organizationDetails?.organization.name ?? 'Organization'}
			onBack={onBack}
			onViewOrganization={onViewOrganization}
		/>
	);
}
