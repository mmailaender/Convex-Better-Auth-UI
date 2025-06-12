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
		typeof api.organizations.members.getOrganizationMembers
	>;
	type InvitationsResponse = FunctionReturnType<
		typeof api.organizations.invitations.db.getInvitations
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
		api.organizations.members.getOrganizationMembers,
		{},
		{ initialData: initialData?.members }
	);
	const invitationsResponse = useQuery(
		api.organizations.invitations.db.getInvitations,
		{},
		{ initialData: initialData?.invitations }
	);

	// Derived data
	const members = $derived(membersResponse.data);
	const invitations = $derived(invitationsResponse.data);
</script>

<Tabs.Root value="members">
	<div
		class="border-surface-300-700 flex w-full flex-row justify-between border-b pb-6 align-middle"
	>
		<Tabs.List>
			<Tabs.Trigger value="members" class="gap-2"
				>Members {members && `(${members.length})`}</Tabs.Trigger
			>
			{#if roles.isOwnerOrAdmin}
				<Tabs.Trigger value="invitations" class="gap-2">
					Invitations {invitations && `(${invitations.length})`}
				</Tabs.Trigger>
			{/if}
		</Tabs.List>
		{#if roles.isOwnerOrAdmin}
			<Dialog.Root>
				<Dialog.Trigger
					class="btn preset-filled-primary-500 hidden h-10 items-center gap-2 text-sm md:flex"
				>
					<Plus size={20} />
					<span>Invite members</span>
				</Dialog.Trigger>
				<Dialog.Content class="max-w-108">
					<Dialog.Header>
						<Dialog.Title>Invite new members</Dialog.Title>
					</Dialog.Header>
					<InviteMembers />
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
			<Drawer.Root>
				<Drawer.Trigger
					class="btn preset-filled-primary-500 absolute right-4 bottom-4 z-10 h-10 text-sm md:hidden"
				>
					<Plus class="size-4" /> Invite members
				</Drawer.Trigger>
				<Drawer.Content>
					<Drawer.Header>
						<Drawer.Title>Invite new members</Drawer.Title>
					</Drawer.Header>
					<InviteMembers />
					<Drawer.Close />
				</Drawer.Content>
			</Drawer.Root>
		{/if}
	</div>

	<Tabs.Content value="members">
		<Members />
	</Tabs.Content>

	{#if roles.isOwnerOrAdmin}
		<Tabs.Content value="invitations">
			<Invitations />
		</Tabs.Content>
	{/if}
</Tabs.Root>
