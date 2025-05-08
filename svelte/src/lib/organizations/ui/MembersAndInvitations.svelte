<script lang="ts">
	// Components
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import Members from '$lib/organizations/ui/Members.svelte';
	import Invitations from '$lib/organizations/ui/Invitations.svelte';
	import InviteMembers from '$lib/organizations/ui/InviteMembers.svelte';

	// API
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { isOwnerOrAdmin } from '$lib/organizations/api/roles.svelte';

	// Convex queries
	const membersResponse = useQuery(api.organizations.members.getOrganizationMembers, {});
	const invitationsResponse = useQuery(api.organizations.invitations.db.getInvitations, {});

	// Derived data
	const members = $derived(membersResponse.data);
	const invitations = $derived(invitationsResponse.data);

	let currentTab: string = $state('members');
</script>

<Tabs value={currentTab} onValueChange={(e) => (currentTab = e.value)}>
	{#snippet list()}
		<Tabs.Control value="members">Members {members && `(${members.length})`}</Tabs.Control>
		{#if isOwnerOrAdmin}
			<Tabs.Control value="invitations">
				Invitations {invitations && `(${invitations.length})`}
			</Tabs.Control>
		{/if}
	{/snippet}

	{#snippet content()}
		<Tabs.Panel value="members">
			<div class="mt-4">
				<InviteMembers />
				<Members />
			</div>
		</Tabs.Panel>

		{#if isOwnerOrAdmin}
			<Tabs.Panel value="invitations">
				<div class="mt-4">
					<Invitations />
				</div>
			</Tabs.Panel>
		{/if}
	{/snippet}
</Tabs>
