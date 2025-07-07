<script lang="ts">
	// Primitives
	import * as Dialog from '$lib/primitives/ui/dialog';
	import { toast } from 'svelte-sonner';
	// Icons
	import { Search } from '@lucide/svelte';

	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { createRoles } from '$lib/organizations/api/roles.svelte';
	const client = useConvexClient();
	const roles = createRoles();

	// Types
	import type { Doc, Id } from '$convex/_generated/dataModel';
	type Role = Doc<'organizationMembers'>['role'];
	import type { FunctionReturnType } from 'convex/server';
	type InvitationResponse = FunctionReturnType<
		typeof api.organizations.invitations.queries.getInvitations
	>;

	// Props
	let { initialData }: { initialData?: InvitationResponse } = $props();

	// Queries
	const invitationsResponse = useQuery(
		api.organizations.invitations.queries.getInvitations,
		{},
		{ initialData }
	);
	const invitations = $derived(invitationsResponse.data);

	// State
	let errorMessage: string = $state('');
	let successMessage: string = $state('');
	let selectedInvitationId: Id<'invitations'> | null = $state(null);
	let searchQuery: string = $state('');
	let revokeModalOpen: boolean = $state(false);

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
			await client.mutation(api.organizations.invitations.mutations.revokeInvitation, {
				invitationId: selectedInvitationId
			});

			errorMessage = '';
			successMessage = 'Invitation revoked successfully!';
			revokeModalOpen = false;
			toast.success('Invitation revoked successfully');
		} catch (err) {
			successMessage = '';
			errorMessage =
				err instanceof Error
					? err.message
					: 'Unknown error. Please try again. If it persists, contact support.';
			toast.error(errorMessage);
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

{#if !invitations}
	<div>Loading invitations...</div>
{:else}
	<div class="flex h-full flex-col">
		<!-- Search Section - Fixed at top -->
		<div class="flex flex-shrink-0 items-center gap-3 py-4">
			<div class="relative flex-1">
				<div class="pointer-events-none absolute inset-y-0 flex items-center pl-2">
					<Search class="text-surface-400-600 size-4" />
				</div>
				<input
					type="text"
					class="input w-hug w-full !border-0 !border-transparent pl-8 text-sm"
					placeholder="Search invitations..."
					value={searchQuery}
					onchange={handleSearchChange}
				/>
			</div>
		</div>

		<!-- Table Section - Scrollable area -->
		<div class="min-h-0 flex-1">
			{#if invitations.length === 0 && !searchQuery}
				<div class="text-surface-600-400 p-8 text-center">
					<p>No pending invitations.</p>
				</div>
			{:else if filteredInvitations.length === 0 && searchQuery}
				<div class="text-surface-600-400 p-8 text-center">
					<p>No invitations match your search.</p>
				</div>
			{:else}
				<div>
					<!-- Table container with controlled height and scroll -->
					<div
						class="max-h-[calc(90vh-12rem)] overflow-y-auto pb-12 sm:max-h-[calc(80vh-12rem)] md:max-h-[calc(70vh-12rem)]"
					>
						<table class="table w-full !table-fixed">
							<thead
								class="sm:bg-surface-200-800 bg-surface-100-900 border-surface-300-700 sticky top-0 z-20 border-b"
							>
								<tr>
									<th class="text-surface-700-300 !w-64 p-2 !pl-0 text-left text-xs"> Email </th>
									<th class="text-surface-700-300 hidden !w-32 p-2 text-left text-xs sm:table-cell">
										Role
									</th>
									<th class="text-surface-700-300 hidden !w-24 p-2 text-left text-xs sm:table-cell">
										Invited By
									</th>
									{#if roles.hasOwnerOrAdminRole}
										<th class="!w-20 p-2 text-right"></th>
									{/if}
								</tr>
							</thead>
							<tbody>
								{#each filteredInvitations as invitation (invitation._id)}
									<tr class="!border-surface-300-700 !border-t">
										<!-- Email -->
										<td class="!w-64 !max-w-64 !truncate !py-3 !pl-0">
											<span class="truncate font-medium">{invitation.email}</span>
										</td>
										<!-- Role -->
										<td class="!text-surface-700-300 hidden !w-32 sm:table-cell">
											<div class="flex items-center">
												{#if invitation.role === 'role_organization_owner'}
													<span
														class="badge preset-filled-primary-50-950 border-primary-200-800 h-6 border px-2"
													>
														Owner
													</span>
												{:else if invitation.role === 'role_organization_admin'}
													<span
														class="badge preset-filled-warning-50-950 border-warning-200-800 h-6 border px-2"
													>
														Admin
													</span>
												{:else}
													<span
														class="badge preset-filled-surface-300-700 border-surface-400-600 h-6 border px-2"
													>
														Member
													</span>
												{/if}
											</div>
										</td>
										<!-- Invited By -->
										<td class="!text-surface-700-300 hidden !h-fit !w-24 !truncate sm:table-cell">
											{invitation.invitedBy.name}
										</td>
										<!-- Actions -->
										<td class="!w-20">
											<div class="flex justify-end">
												{#if roles.hasOwnerOrAdminRole}
													<Dialog.Root bind:open={revokeModalOpen}>
														<Dialog.Trigger
															class="btn btn-sm preset-filled-surface-300-700"
															onclick={() => {
																selectedInvitationId = invitation._id;
																revokeModalOpen = true;
															}}
														>
															Revoke
														</Dialog.Trigger>
														<Dialog.Content class="md:max-w-108">
															<Dialog.Header class="flex-shrink-0">
																<Dialog.Title>Revoke invitation</Dialog.Title>
															</Dialog.Header>
															<article class="flex-shrink-0">
																<p class="opacity-60">
																	Are you sure you want to revoke the invitation sent to{' '}
																	{invitation.email}?
																</p>
															</article>
															<Dialog.Footer class="flex-shrink-0">
																<button
																	type="button"
																	class="btn preset-tonal"
																	onclick={() => (revokeModalOpen = false)}
																>
																	Cancel
																</button>
																<button
																	type="button"
																	class="btn preset-filled-error-500"
																	onclick={handleRevokeInvitation}
																>
																	Confirm
																</button>
															</Dialog.Footer>
														</Dialog.Content>
													</Dialog.Root>
												{/if}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
