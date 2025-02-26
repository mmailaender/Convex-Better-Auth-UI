<script lang="ts">
	import type { Organization, User } from '$lib/db/schema/types/custom';
	import type { Member } from '$lib/organization/api/types';
	import { callForm } from '$lib/primitives/api/callForm';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { onMount } from 'svelte';

	interface Props {
		org: Organization;
	}

	let { org = $bindable() }: Props = $props();
	let searchQuery = $state('');
	let filteredMembers = $derived(filterMembers(org.members));
	let error = $state('');
	let success = $state('');

	onMount(async () => {
		try {
			const members = await callForm<Array<Member>>({
				url: '/org?/getOrganizationMembers',
				data: { organizationId: org.id }
			});
			org.members = members;
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'Unknown error. Please try again. If it persists, contact support.';
			}
		}
	});

	$inspect('Members org: ', org);

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
			try {
				const updatedOrg = await callForm<Organization>({
					url: '/org?/updateMemberRole',
					data: { userId, newRole: select.value }
				});

				success = 'Role updated successfully!';
				org.members = updatedOrg.members;
			} catch (err) {
				error = 'Failed to update role';
				console.error(err);
			}
		}
	}

	async function removeMember(userId: string) {
		try {
			const updatedOrg = await callForm<Organization>({
				url: '/org?/removeUserFromOrganization',
				data: { userId }
			});
			success = 'Member removed successfully!';
			org.members = updatedOrg.members;
		} catch (err) {
			error = 'Failed to remove member';
			console.error(err);
		}
	}
</script>

<div class="p-4">
	<input type="text" class="input" placeholder="Search members..." bind:value={searchQuery} />

	{#if error}
		<p class="text-error-500">{error}</p>
	{/if}
	{#if success}
		<p class="text-success-500">{success}</p>
	{/if}

	<ul class="mt-4 space-y-2">
		{#each filteredMembers as member}
			<li class="flex items-center justify-between gap-2 rounded-lg border p-2">
				<div class="flex items-center space-x-4">
					<Avatar
						src={member.user.avatar}
						name={`${member.user.firstName} ${member.user.lastName}`}
					/>
					<span class="font-semibold">{member.user.firstName} {member.user.lastName}</span>
				</div>

				<div class="flex space-x-2">
					{#if member.role !== 'role_organization_owner'}
						<select
							bind:value={member.role}
							onchange={(event) => handleUpdateRole(member.user.id, event)}
							class="rounded border p-1"
						>
							<option value="role_organization_admin">Admin</option>
							<option value="role_organization_member">Member</option>
						</select>
						<button
							onclick={() => removeMember(member.user.id)}
							class="btn preset-outlined-error-500"
						>
							Remove
						</button>
					{/if}
					{#if member.role === 'role_organization_owner'}
						<span class="text-surface-500">Owner</span>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</div>

<style>
	select {
		cursor: pointer;
	}
</style>
