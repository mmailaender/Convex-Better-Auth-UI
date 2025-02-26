<script lang="ts">
	import { page } from '$app/state';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';

	import ProfileInfo from './ProfileInfo.svelte';
	import DeleteOrganization from './DeleteOrganization.svelte';
	import Members from './Members.svelte';

	import type { User } from '$lib/db/schema/types/custom';

	let derivedUser: User | null = $derived(page.data.user ? JSON.parse(page.data.user) : null);
	let derivedOrg = $derived(derivedUser?.activeOrganization);

	let org = $state(derivedUser?.activeOrganization);

	$effect(() => {
		org = derivedOrg;
	});

	$inspect('OrganizationProfile org: ', org);

	let group = $state('general');
</script>

{#if org}
	<Tabs
		bind:value={group}
		base="flex flex-row min-w-72"
		listBase="flex flex-col pr-2"
		contentBase="flex flex-col"
	>
		{#snippet list()}
			<h1>Organization</h1>
			<h4>Manage your organization.</h4>
			<Tabs.Control
				value="general"
				base="border-r-1 border-transparent"
				stateActive="border-r-surface-950-50 opacity-100">General</Tabs.Control
			>
			<Tabs.Control
				value="members"
				base="border-r-1 border-transparent"
				stateActive="border-r-surface-950-50 opacity-100">Members</Tabs.Control
			>
			<Tabs.Control
				value="billing"
				base="border-r-1 border-transparent"
				stateActive="border-r-surface-950-50 opacity-100">Billing</Tabs.Control
			>
		{/snippet}
		{#snippet content()}
			<Tabs.Panel value="general">
				<ProfileInfo bind:org={org!} />
				<DeleteOrganization bind:org={org!} />
			</Tabs.Panel>
			<Tabs.Panel value="members">
				<Members bind:org={org!} />
			</Tabs.Panel>
			<Tabs.Panel value="billing">Car Panel</Tabs.Panel>
		{/snippet}
	</Tabs>
{/if}
