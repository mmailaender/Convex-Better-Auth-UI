<script lang="ts">
	// Modules
	import { Avatar, Modal } from '@skeletonlabs/skeleton-svelte';
	import { Shield, ShieldCheck } from 'lucide-svelte';

	// Lib
	import { callForm } from '$lib/primitives/api/callForm';

	// Types
	import type { Organization, User } from '$lib/db/schema/types/custom';
	import type { Member, Role } from '$lib/organization/api/types';

	interface Props {
		members: Array<Member>;
		user: User;
		isOwnerOrAdmin: boolean;
	}

	let { user = $bindable(), members, isOwnerOrAdmin }: Props = $props();

	let errorMessage = $state('');
	let successMessage = $state('');

	let openModal = $state(false);
	let error = $state('');

	async function handleUpdateRole(
		userId: string,
		event: Event
		// newRole: 'role_organization_admin' | 'role_organization_member'
	) {
		const select = event.target as HTMLSelectElement;
		if (select) {
			const newRole = select.value as Role;

			try {
				await callForm<Organization>({
					url: '/api/org?/updateMemberRole',
					data: { userId, newRole }
				});

				errorMessage = '';
				successMessage = 'Role updated successfully!';
				user.activeOrganization!.members = user.activeOrganization!.members.map((member) =>
					member.user.id === userId ? { ...member, role: newRole } : member
				);
			} catch (err) {
				successMessage = '';
				errorMessage = 'Failed to update role';
				console.error(err);
			}
		}
	}

	async function removeMember(userId: string) {
		try {
			const updatedmembers = await callForm<Array<Member>>({
				url: '/api/org?/removeUserFromOrganization',
				data: { userId }
			});
			errorMessage = '';
			successMessage = 'Member removed successfully!';
			user.activeOrganization!.members = updatedmembers;
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'Unknown error. Please try again. If it persists, contact support.';
			}
		}
	}
</script>

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
		{#each members as member}
			<tr>
				<td>
					<div class="flex items-center space-x-4">
						<Avatar
							src={member.user.avatar}
							name={`${member.user.firstName} ${member.user.lastName}`}
							size="size-12"
						/>
						<span class="font-semibold">{member.user.firstName} {member.user.lastName}</span>
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
							<Modal
								bind:open={openModal}
								triggerBase="btn text-error-500 hover:preset-tonal-error-500"
								contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-(--breakpoint-sm)"
								backdropClasses="backdrop-blur-xs"
							>
								{#snippet trigger()}
									Remove
								{/snippet}
								{#snippet content()}
									<header class="flex justify-between">
										<h2 class="h2">Remove member</h2>
									</header>
									<article>
										<p class="opacity-60">
											Are you sure you want to delete the member {member.user.firstName}{' '}
											{member.user.lastName}?
										</p>
									</article>
									<footer class="flex justify-end gap-4">
										<button
											type="button"
											class="btn preset-tonal"
											onclick={() => (openModal = false)}
										>
											Cancel
										</button>
										<button
											type="button"
											class="btn preset-filled-error-400-600"
											onclick={() => removeMember(member.user.id)}
										>
											Confirm
										</button>
									</footer>
									{#if error}
										<p class="text-error-600-400">{error}</p>
									{/if}
								{/snippet}
							</Modal>
						{/if}
					</div>
				</td>
			</tr>
		{/each}
	</tbody>
</table>
