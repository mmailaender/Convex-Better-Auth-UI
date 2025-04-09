<script lang="ts">
	import { onMount } from 'svelte';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import { X } from 'lucide-svelte';

	import InviteForm from './InviteMembers.svelte';
	import { callForm } from '$lib/primitives/api/callForm';

	import MembersList from './MembersList.svelte';
	import InvitationList from './InvitationList.svelte';

	import type { MembersAndInvitations } from '$lib/organization/api/types';
	import type { User } from '$lib/db/schema/types/custom';

	interface Props {
		user: User;
	}

	let { user = $bindable() }: Props = $props();

	let invitations = $derived(user.activeOrganization?.invitations ?? []);

	let isOwnerOrAdmin = $derived(
		user.roles?.some((role) =>
			['role_organization_owner', 'role_organization_admin'].includes(role)
		)
	);

	let group = $state('members');

	let searchQuery = $state('');
	let filteredMembers = $derived(filterMembers(user.activeOrganization!.members));

	let openInviteForm = $state(false);

	let errorMessage = $state('');
	let successMessage = $state('');
	let isLoading = $state(true);

	onMount(async () => {
		if (isOwnerOrAdmin) {
			try {
				const membersAndInvitations = await callForm<MembersAndInvitations>({
					url: '/api/org?/getOrganizationMembersAndInvitations',
					data: { organizationId: user.activeOrganization!.id }
				});

				console.log('membersAndInvitations: ', membersAndInvitations);
				user.activeOrganization!.members = membersAndInvitations.members;
				user.activeOrganization!.invitations = membersAndInvitations.invitations;
			} catch (err) {
				if (err instanceof Error) {
					errorMessage = err.message;
				} else {
					errorMessage = 'Unknown error. Please try again. If it persists, contact support.';
				}
			} finally {
				isLoading = false;
			}
		}
	});

	$inspect('Members org: ', user.activeOrganization!);

	function filterMembers(
		members: {
			user: User;
			role: 'role_organization_owner' | 'role_organization_admin' | 'role_organization_member';
		}[]
	) {
		return members
			.filter(({ user }) =>
				`${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
			)
			.sort((a, b) => {
				const roleOrder = {
					role_organization_owner: 0,
					role_organization_admin: 1,
					role_organization_member: 2
				};
				return (
					roleOrder[a.role] - roleOrder[b.role] ||
					a.user.lastName.localeCompare(b.user.lastName) ||
					a.user.firstName.localeCompare(b.user.firstName)
				);
			});
	}
</script>

{#if isLoading}
	<div class="flex justify-center p-4">
		<div class="animate-pulse">Loading...</div>
	</div>
{:else}
	<Tabs value={group} onValueChange={(e) => (group = e.value)}>
		{#snippet list()}
			<Tabs.Control value="members">Members <span>({filteredMembers.length})</span></Tabs.Control>
			<Tabs.Control value="invitations"
				>Invitations <span>({invitations.length})</span></Tabs.Control
			>
		{/snippet}
		{#snippet content()}
			<Tabs.Panel value="members">
				<div class="p-4">
					<div class="flex gap-3">
						<input
							type="text"
							class="input"
							placeholder="Search members..."
							bind:value={searchQuery}
						/>
						{#if isOwnerOrAdmin}
							<button
								type="button"
								class="btn preset-tonal"
								onclick={() => (openInviteForm = !openInviteForm)}>Invite</button
							>
						{/if}
					</div>

					{#if openInviteForm}
						<div class="relative mt-3">
							<InviteForm bind:user />
							<button
								type="button"
								class="btn-icon preset-tonal absolute top-3 right-3 rounded-full"
								onclick={() => (openInviteForm = false)}
							>
								<X />
							</button>
						</div>
					{/if}

					{#if errorMessage}
						<p class="text-error-500">{errorMessage}</p>
					{/if}
					{#if successMessage}
						<p class="text-success-500">{successMessage}</p>
					{/if}

					<MembersList bind:user members={filteredMembers} {isOwnerOrAdmin} />
				</div>
			</Tabs.Panel>
			{#if isOwnerOrAdmin}
				<Tabs.Panel value="invitations">
					{#if isOwnerOrAdmin}
						<button
							type="button"
							class="btn preset-tonal"
							onclick={() => (openInviteForm = !openInviteForm)}>Invite</button
						>
					{/if}
					{#if openInviteForm}
						<div class="relative mt-3">
							<InviteForm bind:user />
							<button
								type="button"
								class="btn-icon preset-tonal absolute top-3 right-3 rounded-full"
								onclick={() => (openInviteForm = false)}
							>
								<X />
							</button>
						</div>
					{/if}
					<InvitationList bind:user {invitations} isOwnerOrAdmin />
				</Tabs.Panel>
			{/if}
		{/snippet}
	</Tabs>
{/if}
