<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { Organization, User } from '$lib/db/schema/types/custom';
	import type { Member, Role } from '$lib/organization/api/types';
	import { callForm } from '$lib/primitives/api/callForm';
	import { Avatar, Tabs } from '@skeletonlabs/skeleton-svelte';
	import { Shield, ShieldCheck, UserPlus } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import InviteForm from './InviteForm.svelte';

	interface Props {
		user: User;
	}

	let { user = $bindable() }: Props = $props();

	let invitations = $derived(user.activeOrganization?.invitations?.data ?? null);

	let isOwnerOrAdmin = $derived(
		user.activeOrganization?.members.some(
			(member) =>
				member.user.id === user.id &&
				['role_organization_owner', 'role_organization_admin'].includes(member.role)
		)
	);

	let group = $state('members');

	let searchQuery = $state('');
	let filteredMembers = $derived(filterMembers(user.activeOrganization!.members));

	let errorMessage = $state('');
	let successMessage = $state('');

	onMount(async () => {
		if (isOwnerOrAdmin) {
			try {
				const members = await callForm<Array<Member>>({
					url: '/org?/getOrganizationMembers',
					data: { organizationId: user.activeOrganization!.id }
				});
				user.activeOrganization.members = members;
			} catch (err) {
				if (err instanceof Error) {
					errorMessage = err.message;
				} else {
					errorMessage = 'Unknown error. Please try again. If it persists, contact support.';
				}
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

	async function handleUpdateRole(
		userId: string,
		event: Event
		// newRole: 'role_organization_admin' | 'role_organization_member'
	) {
		const select = event.target as HTMLSelectElement;
		if (select) {
			const newRole = select.value as Role;

			try {
				const updatedOrg = await callForm<Organization>({
					url: '/org?/updateMemberRole',
					data: { userId, newRole }
				});

				successMessage = 'Role updated successfully!';
				user.activeOrganization!.members = user.activeOrganization!.members.map((member) =>
					member.user.id === userId ? { ...member, role: newRole } : member
				);
			} catch (err) {
				errorMessage = 'Failed to update role';
				console.error(err);
			}
		}
	}

	async function removeMember(userId: string) {
		try {
			const updatedmembers = await callForm<Organization>({
				url: '/org?/removeUserFromOrganization',
				data: { userId }
			});
			successMessage = 'Member removed successfully!';
			user.activeOrganization!.members = updatedmembers;
		} catch (err) {
			errorMessage = 'Failed to remove member';
			console.error(err);
		}
	}
</script>

<Tabs bind:value={group}>
	{#snippet list()}
		<Tabs.Control value="members">Members <span>({filteredMembers.length})</span></Tabs.Control>
		<Tabs.Control value="invitations"
			>Invitations <span>({invitations ? invitations.length : 0})</span></Tabs.Control
		>
	{/snippet}
	{#snippet content()}
		<Tabs.Panel value="members">
			<div class="p-4">
				<input type="text" class="input" placeholder="Search members..." bind:value={searchQuery} />

				{#if isOwnerOrAdmin}
					<InviteForm bind:user />
				{/if}

				{#if errorMessage}
					<p class="text-error-500">{errorMessage}</p>
				{/if}
				{#if successMessage}
					<p class="text-success-500">{successMessage}</p>
				{/if}

				<table class="table caption-bottom">
					<thead>
						<tr class="border-surface-300-700 border-b">
							<th class="p-2 text-left">Name</th>
							<th class="p-2 text-left">Email</th>
							<th class="p-2 text-left">Role</th>
							{#if isOwnerOrAdmin}
								<th class="p-2 text-right">Actions</th>
							{/if}
						</tr>
					</thead>
					<tbody>
						{#each filteredMembers as member}
							<tr>
								<td>
									<div class="flex items-center space-x-4">
										<Avatar
											src={member.user.avatar}
											name={`${member.user.firstName} ${member.user.lastName}`}
										/>
										<span class="font-semibold">{member.user.firstName} {member.user.lastName}</span
										>
									</div>
								</td>
								<td>{member.user.primaryEmail}</td>
								<td>
									<div class="flex items-center">
										{#if isOwnerOrAdmin && member.user.id !== user.id && member.role !== 'role_organization_owner'}
											<select
												bind:value={member.role}
												onchange={(event) => handleUpdateRole(member.user.id, event)}
												class="select"
											>
												<option value="role_organization_admin">Admin</option>
												<option value="role_organization_member">Member</option>
											</select>
										{:else if member.role === 'role_organization_owner'}
											<ShieldCheck class="text-primary-500 mr-1 size-4" />
											<span class="font-medium">Owner</span>
										{:else if member.role === 'role_organization_admin'}
											<Shield class="text-primary-400 mr-1 size-4" />
											<span class="font-medium">Admin</span>
										{:else}
											<span>Member</span>
										{/if}
									</div>
								</td>
								<td>
									<div class="flex space-x-2">
										{#if isOwnerOrAdmin && member.user.id !== user.id && member.role !== 'role_organization_owner'}
											<button
												onclick={() => removeMember(member.user.id)}
												class="btn preset-outlined-error-500"
											>
												Remove
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Tabs.Panel>
		<Tabs.Panel value="invitations">
			{#if invitations == null}
				<div class="text-surface-600-400 p-8 text-center">
					<p>No pending invitations.</p>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-surface-300-700 border-b">
								<th class="p-2 text-left">Email</th>
								<th class="p-2 text-left">Role</th>
								<th class="p-2 text-left">Invited By</th>
								<th class="p-2 text-left">Expires</th>
								{#if isOwnerOrAdmin}
									<th class="p-2 text-right">Actions</th>
								{/if}
							</tr>
						</thead>
						<tbody>
							{#each invitations as invitation}
								<tr class="border-surface-300-700 border-b">
									<td class="p-2">{invitation.email}</td>
									<td class="p-2">
										{#if invitation.role === 'role_organization_owner'}
											<div class="flex items-center">
												<ShieldCheck class="text-primary-500 mr-1 size-4" />
												<span class="font-medium">Owner</span>
											</div>
										{:else if invitation.role === 'role_organization_admin'}
											<div class="flex items-center">
												<Shield class="text-primary-400 mr-1 size-4" />
												<span class="font-medium">Admin</span>
											</div>
										{:else}
											<span>Member</span>
										{/if}
									</td>
									<td class="p-2"
										>{invitation.invitedBy.firstName} {invitation.invitedBy.lastName}</td
									>
									<!-- {#if isOwnerOrAdmin}
										<td class="p-2 text-right">
											<button
												class="btn preset-tonal-error-500"
												onclick={() => revokeInvitation(invitation.id)}
											>
												Revoke
											</button>
										</td>
									{/if} -->
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</Tabs.Panel>
	{/snippet}
</Tabs>
