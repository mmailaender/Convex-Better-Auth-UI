<script lang="ts">
	// Primitives
	import * as Tabs from '$lib/primitives/ui/tabs';
	import * as Dialog from '$lib/primitives/ui/dialog';
	import * as Drawer from '$lib/primitives/ui/drawer';
	// Icons
	import PlusIcon from '@lucide/svelte/icons/plus';
	// Components
	import Members from '$lib/organizations/ui/Members.svelte';
	import Invitations from '$lib/organizations/ui/Invitations.svelte';
	import InviteMembers from '$lib/organizations/ui/InviteMembers.svelte';

	// API
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { useRoles } from '$lib/organizations/api/roles.svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// API Types
	import type { authClient } from '$lib/auth/api/auth-client';
	import type { FunctionReturnType } from 'convex/server';
	type GetActiveOrganizationType = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type ListInvitationType = FunctionReturnType<
		typeof api.organizations.invitations.queries.listInvitations
	>;
	type Role = typeof authClient.$Infer.Member.role;

	// Props
	let {
		initialData
	}: {
		initialData?: {
			activeOrganization?: GetActiveOrganizationType;
			invitationList?: ListInvitationType;
			role?: Role;
		};
	} = $props();

	// Auth
	const auth = useAuth();
	const roles = useRoles({}, () => ({
		initialData: initialData?.role
	}));
	const isOwnerOrAdmin = $derived(roles.hasOwnerOrAdminRole);

	// Queries
	const activeOrganizationResponse = useQuery(
		api.organizations.queries.getActiveOrganization,
		() => (auth.isAuthenticated ? {} : 'skip'),
		() => ({
			initialData: initialData?.activeOrganization
		})
	);
	const invitationListResponse = useQuery(
		api.organizations.invitations.queries.listInvitations,
		() => (auth.isAuthenticated ? {} : 'skip'),
		() => ({
			initialData: initialData?.invitationList
		})
	);
	// Derived data
	const activeOrganization = $derived(activeOrganizationResponse?.data);
	const members = $derived(activeOrganization?.members);
	const invitationList = $derived(invitationListResponse?.data);

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
		<Tabs.List class="flex-1 md:flex-initial">
			<Tabs.Trigger value="members" class="flex-1 gap-2 md:flex-initial">
				Members
				<span class="badge preset-filled-surface-300-700 size-6 rounded-full">
					{members && `${members.length}`}
				</span>
			</Tabs.Trigger>
			{#if isOwnerOrAdmin}
				<Tabs.Trigger value="invitations" class="flex-1 gap-2 md:flex-initial">
					Invitations
					<span class="badge preset-filled-surface-300-700 size-6 rounded-full">
						{invitationList && `${invitationList.filter((i) => i.status === 'pending').length}`}
					</span>
				</Tabs.Trigger>
			{/if}
		</Tabs.List>
		{#if isOwnerOrAdmin}
			<Dialog.Root bind:open={inviteMembersDialogOpen}>
				<Dialog.Trigger
					class="btn preset-filled-primary-500 hidden h-10 items-center gap-2 text-sm md:flex"
				>
					<PlusIcon class="size-5" />
					<span>Invite members</span>
				</Dialog.Trigger>
				<Dialog.Content class="max-w-100">
					<Dialog.Header>
						<Dialog.Title>Invite new members</Dialog.Title>
					</Dialog.Header>
					<InviteMembers onSuccess={handleInviteMembersSuccess} {initialData} />
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
			<Drawer.Root bind:open={inviteMembersDrawerOpen}>
				<Drawer.Trigger
					class="btn preset-filled-primary-500 absolute right-4 bottom-4 z-10 h-10 text-sm md:hidden"
				>
					<PlusIcon class="size-5" /> Invite members
				</Drawer.Trigger>
				<Drawer.Content>
					<Drawer.Header>
						<Drawer.Title>Invite new members</Drawer.Title>
					</Drawer.Header>
					<InviteMembers onSuccess={handleInviteMembersSuccess} {initialData} />
					<Drawer.CloseX />
				</Drawer.Content>
			</Drawer.Root>
		{/if}
	</div>

	<Tabs.Content value="members">
		<Members {initialData} />
	</Tabs.Content>

	{#if isOwnerOrAdmin}
		<Tabs.Content value="invitations">
			<Invitations {initialData} />
		</Tabs.Content>
	{/if}
</Tabs.Root>
