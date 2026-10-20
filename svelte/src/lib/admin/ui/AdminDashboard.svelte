<script lang="ts">
	// SvelteKit
	import { page } from '$app/state';
	import { gotoApp } from '#lib/primitives/utils/navigation.js';
	// Primitives
	import * as Tabs from '#lib/primitives/ui/tabs/index.js';
	// Icons
	import UsersIcon from '@lucide/svelte/icons/users';
	import BuildingIcon from '@lucide/svelte/icons/building-2';
	// Components
	import UsersTable from '#lib/admin/ui/UsersTable.svelte';
	import UserDetails from '#lib/admin/ui/UserDetails.svelte';
	import OrganizationsTable from '#lib/admin/ui/OrganizationsTable.svelte';
	import OrganizationDetails from '#lib/admin/ui/OrganizationDetails.svelte';
	// Constants & API
	import { useQuery } from 'convex-svelte';
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	import {
		ORGANIZATION_PARAM,
		TAB_ORGANIZATIONS,
		TAB_USERS,
		USER_PARAM
	} from '#lib/admin/utils/admin.constants.js';

	const { api, authConstants } = getAuthContext();
	const organizationsEnabled = Boolean(authConstants.organizations);

	// Tab state lives in `?adminTab=` so the active tab survives reloads and can
	// be deep-linked.
	const activeTab = $derived(
		page.url.searchParams.get('adminTab') === TAB_ORGANIZATIONS && organizationsEnabled
			? TAB_ORGANIZATIONS
			: TAB_USERS
	);

	// What shows instead of a tab's table, in the URL like the tab: a user profile in either tab,
	// and an organization in the organizations tab, with the profiles of its members above it
	const profileUserId = $derived(page.url.searchParams.get(USER_PARAM));
	// Ark renders the inactive tab's panel too, hidden, so each tab checks it's the active one
	const usersProfileId = $derived(activeTab === TAB_USERS ? profileUserId : null);
	const organizationsProfileId = $derived(activeTab === TAB_ORGANIZATIONS ? profileUserId : null);
	const organizationId = $derived(
		activeTab === TAB_ORGANIZATIONS ? page.url.searchParams.get(ORGANIZATION_PARAM) : null
	);

	// Names the organization on the back button of a member's profile. The organization page
	// beneath subscribes to the same query, so this doesn't fetch it again
	const organizationQuery = useQuery(api.admin.queries.getOrganizationWithMembers, () =>
		organizationId && organizationsProfileId ? { organizationId } : 'skip'
	);

	/** Navigates within the dashboard to the given tab and query parameters. */
	function navigate(
		tab: string,
		params: { [USER_PARAM]?: string | null; [ORGANIZATION_PARAM]?: string | null },
		replace = false
	) {
		const url = new URL(page.url.href);
		url.searchParams.set('adminTab', tab);
		for (const [key, value] of Object.entries(params)) {
			if (value) url.searchParams.set(key, value);
			else url.searchParams.delete(key);
		}
		// Pages get a history entry, so the browser's back button returns to where the admin came from
		void gotoApp(url, replace ? { replace: true, reset: false } : undefined);
	}

	function setActiveTab(tab: string | null) {
		if (!tab || tab === activeTab) return;
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
</script>

{#snippet profile(userId: string | null, backLabel: string)}
	{#if userId}
		{#key userId}
			<UserDetails
				{userId}
				{backLabel}
				onBack={() => showProfile(null)}
				onViewOrganization={showOrganization}
			/>
		{/key}
	{/if}
{/snippet}

<Tabs.Root value={activeTab} onValueChange={(details) => setActiveTab(details.value)}>
	<Tabs.List class="flex gap-2">
		<Tabs.Trigger value={TAB_USERS} class="flex items-center gap-2">
			<UsersIcon class="size-4" />
			<span>Users</span>
		</Tabs.Trigger>
		{#if organizationsEnabled}
			<Tabs.Trigger value={TAB_ORGANIZATIONS} class="flex items-center gap-2">
				<BuildingIcon class="size-4" />
				<span>Organizations</span>
			</Tabs.Trigger>
		{/if}
	</Tabs.List>

	<Tabs.Content value={TAB_USERS}>
		{@render profile(usersProfileId, 'Users')}
		<!-- Stays mounted behind a profile, so the search and loaded rows survive going back -->
		<div class:hidden={usersProfileId}>
			<UsersTable onViewProfile={showProfile} />
		</div>
	</Tabs.Content>

	{#if organizationsEnabled}
		<Tabs.Content value={TAB_ORGANIZATIONS}>
			{@render profile(
				organizationsProfileId,
				organizationId
					? (organizationQuery.data?.organization.name ?? 'Organization')
					: 'Organizations'
			)}
			<!-- Like the users table, these stay mounted behind what opens above them -->
			{#if organizationId}
				<div class:hidden={organizationsProfileId}>
					{#key organizationId}
						<OrganizationDetails
							{organizationId}
							onBack={() => showOrganization(null)}
							onViewProfile={showProfile}
						/>
					{/key}
				</div>
			{/if}
			<div class:hidden={organizationsProfileId || organizationId}>
				<OrganizationsTable onViewOrganization={showOrganization} />
			</div>
		</Tabs.Content>
	{/if}
</Tabs.Root>
