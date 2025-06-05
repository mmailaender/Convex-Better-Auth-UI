<script lang="ts">
	// Components
	import { Modal } from '@skeletonlabs/skeleton-svelte';
	import { X } from '@lucide/svelte';

	// API
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { createRoles } from '$lib/organizations/api/roles.svelte';
	import { goto } from '$app/navigation';
	const roles = createRoles();
	const client = useConvexClient();

	// Types
	import type { Id } from '$convex/_generated/dataModel';
	import type { FunctionReturnType } from 'convex/server';
	type ActiveOrganizationResponse = FunctionReturnType<
		typeof api.organizations.getActiveOrganization
	>;
	type MembersResponse = FunctionReturnType<
		typeof api.organizations.members.getOrganizationMembers
	>;
	type UserResponse = FunctionReturnType<typeof api.users.getUser>;

	// Props
	let {
		initialData
	}: {
		initialData?: {
			activeOrganization: ActiveOrganizationResponse;
			members: MembersResponse;
			user: UserResponse;
		};
	} = $props();

	// Queries
	const userResponse = useQuery(api.users.getUser, {}, { initialData: initialData?.user });
	const organizationResponse = useQuery(
		api.organizations.getActiveOrganization,
		{},
		{ initialData: initialData?.activeOrganization }
	);
	const membersResponse = useQuery(
		api.organizations.members.getOrganizationMembers,
		{},
		{ initialData: initialData?.members }
	);

	// State
	let modalOpen: boolean = $state(false);
	let errorMessage: string = $state('');
	let selectedSuccessor: Id<'users'> | null = $state(null);

	// Derived data
	const currentUser = $derived(userResponse.data);
	const activeOrganization = $derived(organizationResponse.data);
	const members = $derived(membersResponse.data);

	// Organization members excluding current user for successor selection
	const organizationMembers = $derived(
		members?.filter(
			(member) =>
				// Don't include the current user
				member.user._id !== currentUser?._id
		) || []
	);

	/**
	 * Validates form input before submission
	 */
	function validateForm(): boolean {
		if (roles.isOwner && !selectedSuccessor) {
			errorMessage = 'As the organization owner, you must select a successor before leaving.';
			return false;
		}
		return true;
	}

	/**
	 * Handles the leave organization action
	 */
	async function handleLeaveOrganization(): Promise<void> {
		if (!validateForm()) return;

		if (!activeOrganization?._id) {
			errorMessage = 'No active organization found.';
			return;
		}

		try {
			await client.mutation(api.organizations.members.leaveOrganization, {
				organizationId: activeOrganization._id,
				// Only send successorId if the user is an owner and a successor is selected
				...(roles.isOwner && selectedSuccessor ? { successorId: selectedSuccessor } : {})
			});

			modalOpen = false;

			// Navigate to home page after leaving
			goto('/');
		} catch (err) {
			errorMessage =
				err instanceof Error ? err.message : 'Failed to leave organization. Please try again.';
			console.error(err);
		}
	}

	/**
	 * Handles the cancel action
	 */
	function handleCancel(): void {
		modalOpen = false;
	}

	/**
	 * Handles successor selection change
	 */
	function handleSuccessorChange(e: Event): void {
		const select = e.target as HTMLSelectElement;
		selectedSuccessor = select.value ? (select.value as Id<'users'>) : null;
	}
</script>

{#if activeOrganization && members && members.length > 1}
	<Modal
		open={modalOpen}
		onOpenChange={(e) => (modalOpen = e.open)}
		triggerBase="btn text-error-500 hover:preset-tonal-error-500"
		contentBase="card p-4 space-y-4 shadow-xl max-w-screen-sm"
	>
		<!-- Leave organization trigger button -->
		{#snippet trigger()}
			Leave organization
		{/snippet}

		<!-- Modal content -->
		{#snippet content()}
			<header class="flex justify-between">
				<h2 class="h2">Leave organization</h2>
				<button
					class="btn-icon preset-tonal size-8 rounded-full"
					onclick={() => (modalOpen = false)}
					aria-label="Close"
				>
					<X class="size-4" />
				</button>
			</header>

			<div class="space-y-4">
				<p class="opacity-60">
					Are you sure you want to leave your organization? You will lose access to all projects and
					resources.
				</p>

				{#if roles.isOwner}
					<div class="border-warning-300 bg-warning-100 rounded-md border p-3">
						<p class="text-warning-800 text-sm font-medium">
							As the organization owner, you must designate a successor before leaving.
						</p>
					</div>

					<div class="space-y-2">
						<label for="successor" class="text-surface-800-200 font-medium">
							Select a successor:
						</label>
						<select
							id="successor"
							value={selectedSuccessor?.toString() || ''}
							onchange={handleSuccessorChange}
							class="select w-full"
							required={roles.isOwner}
						>
							<option value="" disabled>Choose a successor</option>
							{#each organizationMembers as member}
								<option value={member.user._id.toString()}>
									{member.user.name} ({member.user.email})
								</option>
							{/each}
						</select>
					</div>
				{/if}

				{#if errorMessage}
					<p class="text-error-600-400">{errorMessage}</p>
				{/if}

				<footer class="mt-6 flex justify-end gap-4">
					<button type="button" class="btn bg-surface-300" onclick={handleCancel}>Cancel</button>
					<button
						type="button"
						class="btn bg-error-500 hover:bg-error-600 text-white"
						onclick={handleLeaveOrganization}
						disabled={roles.isOwner && !selectedSuccessor}
					>
						Confirm
					</button>
				</footer>
			</div>
		{/snippet}
	</Modal>
{/if}
