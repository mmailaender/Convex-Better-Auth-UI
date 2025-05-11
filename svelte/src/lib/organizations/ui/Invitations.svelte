<script lang="ts">
	// Components
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
	import type { FunctionReturnType } from 'convex/server';
	type InvitationResponse = FunctionReturnType<
		typeof api.organizations.invitations.db.getInvitations
	>;

	// Props
	let { initialData }: { initialData?: InvitationResponse } = $props();

	// Queries
	const invitationsResponse = useQuery(
		api.organizations.invitations.db.getInvitations,
		{},
		{ initialData }
	);

	// State
	let errorMessage: string = $state('');
	let successMessage: string = $state('');
	let selectedInvitationId: Id<'invitations'> | null = $state(null);
	let searchQuery: string = $state('');
	let revokeModalOpen: boolean = $state(false);

	// Derived data
	const invitations = $derived(invitationsResponse.data);
	const roles = createRoles();

	/**
	 * Filter invitations based on search query
	 */
	const filteredInvitations = $derived.by(() => {
		if (!invitations) return [];

		return invitations
			.filter((invitation) => {
				if (!searchQuery) return true;

				return invitation.email.toLowerCase().includes(searchQuery.toLowerCase());
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

				// Secondary sort by email
				return a.email.localeCompare(b.email);
			});
	});

	/**
	 * Handles revoking an invitation
	 */
	async function handleRevokeInvitation(): Promise<void> {
		if (!selectedInvitationId) return;

		try {
			await client.mutation(api.organizations.invitations.db.revokeInvitation, {
				invitationId: selectedInvitationId
			});

			errorMessage = '';
			successMessage = 'Invitation revoked successfully!';
			revokeModalOpen = false;
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
</script>

{#if invitations}
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
					placeholder="Search invitations..."
					value={searchQuery}
					onchange={handleSearchChange}
				/>
			</div>
		</div>

		{#if invitations.length === 0 && !searchQuery}
			<div class="text-surface-600-400 p-8 text-center">
				<p>No pending invitations.</p>
			</div>
		{:else if filteredInvitations.length === 0 && searchQuery}
			<div class="text-surface-600-400 p-8 text-center">
				<p>No invitations match your search.</p>
			</div>
		{:else}
			<table class="table caption-bottom">
				<thead>
					<tr class="border-surface-300-700 border-b">
						<th class="p-2 text-left">Email</th>
						<th class="p-2 text-left">Role</th>
						<th class="p-2 text-left">Invited By</th>
						{#if roles.isOwnerOrAdmin}
							<th class="p-2 text-right">Actions</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each filteredInvitations as invitation (invitation._id)}
						<tr class="border-surface-300-700 border-b">
							<td class="p-2">{invitation.email}</td>
							<td class="p-2">
								<div class="flex items-center">
									{#if invitation.role === 'role_organization_owner'}
										<ShieldCheck class="text-primary-500 mr-1 size-4" />
										<span class="font-medium">Owner</span>
									{:else if invitation.role === 'role_organization_admin'}
										<Shield class="text-primary-400 mr-1 size-4" />
										<span class="font-medium">Admin</span>
									{:else}
										<span>Member</span>
									{/if}
								</div>
							</td>
							<td class="p-2">{invitation.invitedBy.name}</td>
							{#if roles.isOwnerOrAdmin}
								<td class="p-2 text-right">
									<Modal
										open={revokeModalOpen}
										onOpenChange={(e) => (revokeModalOpen = e.open)}
										triggerBase="btn text-error-500 hover:preset-tonal-error-500"
										contentBase="card bg-surface-100-900 max-w-(--breakpoint-sm) space-y-4 p-4 shadow-xl"
									>
										<!-- Modal Trigger -->
										{#snippet trigger()}
											<button
												onclick={() => {
													selectedInvitationId = invitation._id;
													revokeModalOpen = true;
												}}
											>
												Revoke
											</button>
										{/snippet}

										<!-- Modal Content -->
										{#snippet content()}
											<header class="flex justify-between">
												<h2 class="h2">Revoke invitation</h2>
												<button
													class="btn-icon preset-tonal size-8 rounded-full"
													onclick={() => (revokeModalOpen = false)}
													aria-label="Close"
												>
													<X class="size-4" />
												</button>
											</header>
											<article>
												<p class="opacity-60">
													Are you sure you want to revoke the invitation sent to {invitation.email}?
												</p>
											</article>
											<footer class="flex justify-end gap-4">
												<button
													type="button"
													class="btn preset-tonal"
													onclick={() => (revokeModalOpen = false)}
												>
													Cancel
												</button>
												<button
													type="button"
													class="btn preset-filled-error-400-600"
													onclick={handleRevokeInvitation}
												>
													Confirm
												</button>
											</footer>
											{#if errorMessage}
												<p class="text-error-600-400">{errorMessage}</p>
											{/if}
										{/snippet}
									</Modal>
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
{:else}
	<div>Loading invitations...</div>
{/if}
