<script lang="ts">
	// Primitives
	import * as Tabs from '$lib/primitives/ui/tabs';
	import * as Dialog from '$lib/primitives/ui/dialog';
	import * as Drawer from '$lib/primitives/ui/drawer';
	// Icons
	import { Plus } from '@lucide/svelte';
	// Components
	import Members from '$lib/organizations/ui/Members.svelte';
	import Invitations from '$lib/organizations/ui/Invitations.svelte';
	import InviteMembers from '$lib/organizations/ui/InviteMembers.svelte';

	// API
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { createRoles } from '$lib/organizations/api/roles.svelte';
	const roles = createRoles();

	// API Types
	import type { FunctionReturnType } from 'convex/server';
	type MembersResponse = FunctionReturnType<
		typeof api.organizations.members.queries.getOrganizationMembers
	>;
	type InvitationsResponse = FunctionReturnType<
		typeof api.organizations.invitations.queries.getInvitations
	>;

	// Props
	let {
		initialData
	}: {
		initialData?: {
			members: MembersResponse;
			invitations: InvitationsResponse;
		};
	} = $props();

	// Queries
	const membersResponse = useQuery(
		api.organizations.members.queries.getOrganizationMembers,
		{},
		{ initialData: initialData?.members }
	);
	const invitationsResponse = useQuery(
		api.organizations.invitations.queries.getInvitations,
		{},
		{ initialData: initialData?.invitations }
	);

	// Derived data
	const members = $derived(membersResponse.data);
	const invitations = $derived(invitationsResponse.data);

	// State
	let inviteMembersDialogOpen = $state(false);
	let inviteMembersDrawerOpen = $state(false);

	// Handlers
	function handleInviteMembersSuccess() {
		inviteMembersDialogOpen = false;
		inviteMembersDrawerOpen = false;
	}
</script>

<Tabs.Root value="members">
	<div
		class="border-surface-300-700 flex w-full flex-row justify-between border-b pb-6 align-middle"
	>
		<Tabs.List>
			<Tabs.Trigger value="members" class="gap-2">
				handleInviteMembersSuccess
				<span class="badge preset-filled-surface-300-700 size-6 rounded-full">
					{members && `${members.length}`}
				</span>
			</Tabs.Trigger>
			{#if roles.hasOwnerOrAdminRole}
				<Tabs.Trigger value="invitations" class="gap-2">
					Invitations
					<span class="badge preset-filled-surface-300-700 size-6 rounded-full text-center">
						{invitations && `${invitations.length}`}
					</span>
				</Tabs.Trigger>
			{/if}
		</Tabs.List>
		{#if roles.hasOwnerOrAdminRole}
			<Dialog.Root bind:open={inviteMembersDialogOpen}>
				<Dialog.Trigger
					class="btn preset-filled-primary-500 hidden h-10 items-center gap-2 text-sm md:flex"
				>
					<Plus class="size-5" />
					<span>Invite members</span>
				</Dialog.Trigger>
				<Dialog.Content class="max-w-108">
					<Dialog.Header>
						<Dialog.Title>Invite new members</Dialog.Title>
					</Dialog.Header>
					<InviteMembers onSuccess={handleInviteMembersSuccess} />
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
			<Drawer.Root bind:open={inviteMembersDrawerOpen}>
				<Drawer.Trigger
					class="btn preset-filled-primary-500 absolute right-4 bottom-4 z-10 h-10 text-sm md:hidden"
				>
					<Plus class="size-5" /> Invite members
				</Drawer.Trigger>
				<Drawer.Content>
					<Drawer.Header>
						<Drawer.Title>Invite new members</Drawer.Title>
					</Drawer.Header>
					<InviteMembers onSuccess={handleInviteMembersSuccess} />
					<Drawer.CloseX />
				</Drawer.Content>
			</Drawer.Root>
		{/if}
	</div>

	<Tabs.Content value="members">
		<Members />
	</Tabs.Content>

	{#if roles.hasOwnerOrAdminRole}
		<Tabs.Content value="invitations">
			<Invitations />
		</Tabs.Content>
	{/if}
</Tabs.Root>
