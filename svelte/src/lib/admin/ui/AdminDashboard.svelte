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
	// Constants & API
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	import { TAB_ORGANIZATIONS, TAB_USERS, USER_PARAM } from '#lib/admin/utils/admin.constants.js';

	const { authConstants } = getAuthContext();
	const organizationsEnabled = Boolean(authConstants.organizations);

	// Tab state lives in `?adminTab=` so the active tab survives reloads and can
	// be deep-linked.
	const activeTab = $derived(
		page.url.searchParams.get('adminTab') === TAB_ORGANIZATIONS && organizationsEnabled
			? TAB_ORGANIZATIONS
			: TAB_USERS
	);

	// The user whose profile shows instead of the users table, in `?adminUser=` like the tab
	const profileUserId = $derived(page.url.searchParams.get(USER_PARAM));

	function setActiveTab(tab: string | null) {
		if (!tab || tab === activeTab) return;
		const url = new URL(page.url.href);
		url.searchParams.set('adminTab', tab);
		url.searchParams.delete(USER_PARAM);
		void gotoApp(url, { replace: true, reset: false });
	}

	/** Shows the profile of `userId`, or the users table without one. */
	function showProfile(userId: string | null) {
		const url = new URL(page.url.href);
		url.searchParams.set('adminTab', TAB_USERS);
		if (userId) url.searchParams.set(USER_PARAM, userId);
		else url.searchParams.delete(USER_PARAM);
		// A new history entry, so the browser's back button returns to where the admin came from
		void gotoApp(url);
	}
</script>

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
		{#if profileUserId}
			{#key profileUserId}
				<UserDetails userId={profileUserId} onBack={() => showProfile(null)} />
			{/key}
		{/if}
		<!-- Stays mounted behind a profile, so the search and loaded rows survive going back -->
		<div class:hidden={profileUserId}>
			<UsersTable onViewProfile={showProfile} />
		</div>
	</Tabs.Content>

	{#if organizationsEnabled}
		<Tabs.Content value={TAB_ORGANIZATIONS}>
			<OrganizationsTable onViewProfile={showProfile} />
		</Tabs.Content>
	{/if}
</Tabs.Root>
