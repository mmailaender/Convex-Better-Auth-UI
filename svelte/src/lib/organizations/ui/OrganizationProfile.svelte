<script lang="ts">
	// Components
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import OrganizationInfo from '$lib/organizations/ui/OrganizationInfo.svelte';
	import DeleteOrganization from '$lib/organizations/ui/DeleteOrganization.svelte';
	import MembersAndInvitations from '$lib/organizations/ui/MembersAndInvitations.svelte';
	import LeaveOrganization from '$lib/organizations/ui/LeaveOrganization.svelte';

	// API
	import { isOwnerOrAdmin } from '$lib/organizations/api/roles.svelte';

	// Types
	type OrganizationProfileProps = {
		/**
		 * Optional callback that will be called when an organization is successfully deleted
		 */
		onSuccessfulDelete?: (() => void) | undefined;
	};

	const { onSuccessfulDelete }: OrganizationProfileProps = $props();

	// State
	let currentTab: string = $state('general');
</script>

<Tabs
	value={currentTab}
	onValueChange={(e) => (currentTab = e.value)}
	base="flex flex-row w-192 h-160"
	listBase="flex flex-col pr-2 w-30"
	contentBase="flex flex-col"
>
	{#snippet list()}
		<h1>Organization</h1>
		<h4>Manage your organization.</h4>
		<Tabs.Control
			value="general"
			base="border-r-1 border-transparent"
			stateActive="border-r-surface-950-50 opacity-100"
		>
			General
		</Tabs.Control>
		{#if isOwnerOrAdmin}
			<Tabs.Control
				value="members"
				base="border-r-1 border-transparent"
				stateActive="border-r-surface-950-50 opacity-100"
			>
				Members
			</Tabs.Control>
			<Tabs.Control
				value="billing"
				base="border-r-1 border-transparent"
				stateActive="border-r-surface-950-50 opacity-100"
			>
				Billing
			</Tabs.Control>
		{/if}
	{/snippet}

	{#snippet content()}
		<Tabs.Panel value="general">
			<OrganizationInfo />
			<DeleteOrganization {onSuccessfulDelete} />
			<LeaveOrganization />
		</Tabs.Panel>
		{#if isOwnerOrAdmin}
			<Tabs.Panel value="members">
				<MembersAndInvitations />
			</Tabs.Panel>
			<Tabs.Panel value="billing">Billing Panel</Tabs.Panel>
		{/if}
	{/snippet}
</Tabs>
