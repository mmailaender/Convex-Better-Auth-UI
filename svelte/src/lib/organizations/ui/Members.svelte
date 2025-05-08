<script lang="ts">
	// Components
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { Modal } from '@skeletonlabs/skeleton-svelte';
	import { X, Shield, ShieldCheck, Search } from 'lucide-svelte';

	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { createRoles } from '$lib/organizations/api/roles.svelte';
	const client = useConvexClient();

	// Types
	import type { Doc, Id } from '$convex/_generated/dataModel';
	type Role = Doc<'organizationMembers'>['role'];

	// Queries
	const currentUserResponse = useQuery(api.users.getUser, {});
	const currentOrganizationResponse = useQuery(api.organizations.getActiveOrganization, {});
	const membersResponse = useQuery(api.organizations.members.getOrganizationMembers, {});

	// State
	let errorMessage: string = $state('');
	let successMessage: string = $state('');
	let selectedUserId: Id<'users'> | null = $state(null);
	let searchQuery: string = $state('');
	let removeModalOpen: boolean = $state(false);

	// Derived data
	const currentUser = $derived(currentUserResponse.data);
	const currentOrganization = $derived(currentOrganizationResponse.data);
	const members = $derived(membersResponse.data);
	const roles = createRoles();

	/**
	 * Filter and sort members based on search query and role
	 */
	const filteredMembers = $derived(() => {
		if (!members) return [];

		return members
			.filter((member) => {
				if (!searchQuery) return true;

				const memberName = member.user.name;
				return memberName.toLowerCase().includes(searchQuery.toLowerCase());
			})
			.sort((a, b) => {
				// Sort by role (owner first, then admin, then member)
				const roleOrder: Record<Role, number> = {
					role_organization_owner: 0,
					role_organization_admin: 1,
					role_organization_member: 2
				};

				// Primary sort by role
				const roleDiff = roleOrder[a.role] - roleOrder[b.role];
				if (roleDiff !== 0) return roleDiff;

				// Secondary sort by name
				return a.user.name.localeCompare(b.user.name);
			});
	});

	/**
	 * Handles updating a member's role
	 */
	async function handleUpdateRole(userId: Id<'users'>, newRole: Role): Promise<void> {
		if (newRole === 'role_organization_owner') return; // Cannot set someone as owner this way

		try {
			await client.mutation(api.organizations.members.updateMemberRole, {
				userId,
				newRole
			});

			errorMessage = '';
			successMessage = 'Role updated successfully!';
		} catch (err) {
			successMessage = '';
			errorMessage = err instanceof Error ? err.message : 'Failed to update role';
			console.error(err);
		}
	}

	/**
	 * Handles removing a member from the organization
	 */
	async function handleRemoveMember(): Promise<void> {
		if (!selectedUserId) return;

		try {
			await client.mutation(api.organizations.members.removeMember, {
				userId: selectedUserId
			});

			errorMessage = '';
			successMessage = 'Member removed successfully!';
		} catch (err) {
			successMessage = '';
			errorMessage =
				err instanceof Error
					? err.message
					: 'Unknown error. Please try again. If it persists, contact support.';
		}
	}

	/**
	 * Handle search input change
	 */
	function handleSearchChange(e: Event): void {
		const target = e.target as HTMLInputElement;
		searchQuery = target.value;
	}

	/**
	 * Handle role selection change
	 */
	function handleRoleChange(e: Event, userId: Id<'users'>): void {
		const target = e.target as HTMLSelectElement;
		handleUpdateRole(userId, target.value as Role);
	}
</script>

{#if members}
	<div>
		{#if errorMessage}
			<p class="text-error-500">{errorMessage}</p>
		{/if}
		{#if successMessage}
			<p class="text-success-500">{successMessage}</p>
		{/if}

		<div class="mb-4 flex items-center gap-3">
			<div class="relative flex-1">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<Search class="text-surface-400-600 size-4" />
				</div>
				<input
					type="text"
					class="input w-full pl-10"
					placeholder="Search members..."
					value={searchQuery}
					onchange={handleSearchChange}
				/>
			</div>
		</div>

		<table class="table caption-bottom">
			<thead>
				<tr class="border-surface-300-700 border-b">
					<th class="p-2 text-left">Name</th>
					<th class="p-2 text-left">Email</th>
					<th class="p-2 text-left">Role</th>
					{#if roles.isOwnerOrAdmin}
						<th class="p-2 text-right">Actions</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each filteredMembers as member (member._id)}
					<tr>
						<!-- Member Name -->
						<td>
							<div class="flex items-center space-x-4">
								<div class="avatar">
									<div class="size-12">
										{#if member.user.image}
											<Avatar src={member.user.image} name={member.user.name} size="size-12" />
										{:else}
											<div
												class="bg-primary-100 text-primary-700 flex h-full w-full items-center justify-center rounded-full"
											>
												{member.user.name?.charAt(0) || 'U'}
											</div>
										{/if}
									</div>
								</div>
								<span class="font-semibold">{member.user.name}</span>
							</div>
						</td>
						<!-- Member Email -->
						<td>{member.user.email}</td>
						<!-- Member Role -->
						<td>
							<div class="flex items-center">
								{#if roles.isOwnerOrAdmin && member.user._id !== currentUser?._id && member.role !== 'role_organization_owner'}
									<select
										value={member.role}
										onchange={(e) => handleRoleChange(e, member.user._id)}
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
						<!-- Member Actions -->
						{#if roles.isOwnerOrAdmin}
							<td>
								<div class="flex justify-end space-x-2">
									{#if member.user._id !== currentUser?._id && member.role !== 'role_organization_owner'}
										<Modal
											open={removeModalOpen}
											onOpenChange={(e) => (removeModalOpen = e.open)}
											triggerBase="btn text-error-500 hover:preset-tonal-error-500"
											contentBase="card bg-surface-100-900 max-w-(--breakpoint-sm) space-y-4 p-4 shadow-xl"
										>
											<!-- Modal Trigger -->
											{#snippet trigger()}
												<button
													onclick={() => {
														selectedUserId = member.user._id;
														removeModalOpen = true;
													}}>Remove</button
												>
											{/snippet}

											<!-- Modal Content -->
											{#snippet content()}
												<header class="flex justify-between">
													<h2 class="h2">Remove member</h2>
													<button
														class="btn-icon preset-tonal size-8 rounded-full"
														onclick={() => (removeModalOpen = false)}
														aria-label="Close"
													>
														<X class="size-4" />
													</button>
												</header>
												<article>
													<p class="opacity-60">
														Are you sure you want to remove the member {member.user.name}?
													</p>
												</article>
												<footer class="flex justify-end gap-4">
													<button
														type="button"
														class="btn preset-tonal"
														onclick={() => (removeModalOpen = false)}
													>
														Cancel
													</button>
													<button
														type="button"
														class="btn preset-filled-error-400-600"
														onclick={handleRemoveMember}
													>
														Confirm
													</button>
												</footer>
												{#if errorMessage}
													<p class="text-error-600-400">{errorMessage}</p>
												{/if}
											{/snippet}
										</Modal>
									{/if}
								</div>
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<div>Loading members...</div>
{/if}
